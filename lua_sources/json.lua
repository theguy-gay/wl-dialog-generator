local json = {}

-- Helper: join array of strings manually
local function join(list, sep)
    local s = ""
    sep = sep or ""
    for i = 1, #list do
        s = s .. list[i]
        if i < #list then s = s .. sep end
    end
    return s
end

-- Encode Lua value to JSON string
function json.encode(value)
    local t = type(value)
    if t == "number" then
        return tostring(value)
    elseif t == "boolean" then
        return value and "true" or "false"
    elseif t == "string" then
        local s = value:gsub('[%z\1-\31\\"]', function(c)
            local map = {['"']='"',['\\']='\\',['\b']='b',['\f']='f',['\n']='n',['\r']='r',['\t']='t'}
            local r = map[c]
            if r then return "\\"..r else return string.format("\\u%04d", string.byte(c)) end
        end)
        return '"' .. s .. '"'
    elseif t == "table" then
        local is_array = true
        local i = 1
        for k,_ in pairs(value) do
            if k ~= i then is_array=false; break end
            i=i+1
        end
        local parts = {}
        if is_array then
            for i=1,#value do
                parts[#parts+1] = json.encode(value[i])
            end
            return "[" .. join(parts, ",") .. "]"
        else
            for k,v in pairs(value) do
                parts[#parts+1] = json.encode(k) .. ":" .. json.encode(v)
            end
            return "{" .. join(parts, ",") .. "}"
        end
    else
        return "null"
    end
end

-- Decode JSON string to Lua value
function json.decode(str_input)
    local str = str_input
    local pos = 1
    local len = string.len(str)

    local skipws
    local parse_value, parse_string, parse_number, parse_array, parse_object

    -- skip whitespace
    skipws = function()
        while pos <= len and string.sub(str,pos,pos):match("%s") do
            pos = pos + 1
        end
    end

    parse_string = function()
        pos = pos + 1
        local s = {}
        while pos <= len do
            local c = string.sub(str,pos,pos)
            if c == '"' then pos = pos + 1; return join(s) end
            if c == '\\' then
                local nextc = string.sub(str,pos+1,pos+1)
                local map = {['"']='"',['\\']='\\',['/']='/',['b']='\b',['f']='\f',['n']='\n',['r']='\r',['t']='\t'}
                local r = map[nextc]
                if r then
                    s[#s+1] = r
                    pos = pos + 2
                else
                    error("Unsupported escape at position "..pos)
                end
            else
                s[#s+1] = c
                pos = pos + 1
            end
        end
        error("Unterminated string")
    end

    parse_number = function()
        local start = pos
        while pos <= len and string.sub(str,pos,pos):match("[%d+%.%-eE]") do
            pos = pos + 1
        end
        local n = tonumber(string.sub(str,start,pos-1))
        if not n then error("Invalid number at position "..start) end
        return n
    end

    parse_array = function()
        pos = pos + 1
        local arr = {}
        skipws()
        if string.sub(str,pos,pos) == "]" then pos=pos+1; return arr end
        while true do
            arr[#arr+1] = parse_value()
            skipws()
            local c = string.sub(str,pos,pos)
            if c == "," then pos = pos + 1
            elseif c == "]" then pos = pos + 1; break
            else error("Expected , or ] at position "..pos) end
        end
        return arr
    end

    parse_object = function()
        pos = pos + 1
        local obj = {}
        skipws()
        if string.sub(str,pos,pos) == "}" then pos=pos+1; return obj end
        while true do
            skipws()
            local key = parse_string()
            skipws()
            if string.sub(str,pos,pos) ~= ":" then error("Expected : at position "..pos) end
            pos = pos + 1
            local val = parse_value()
            obj[key] = val
            skipws()
            local c = string.sub(str,pos,pos)
            if c == "," then pos=pos+1
            elseif c == "}" then pos=pos+1; break
            else error("Expected , or } at position "..pos) end
        end
        return obj
    end

    parse_value = function()
        skipws()
        local c = string.sub(str,pos,pos)
        if c == "{" then return parse_object()
        elseif c == "[" then return parse_array()
        elseif c == '"' then return parse_string()
        elseif c:match("[%d%-]") then return parse_number()
        elseif string.sub(str,pos,pos+3) == "true" then pos=pos+4; return true
        elseif string.sub(str,pos,pos+4) == "false" then pos=pos+5; return false
        elseif string.sub(str,pos,pos+3) == "null" then pos=pos+4; return nil
        else error("Invalid JSON at position "..pos) end
    end

    return parse_value()
end

return json
