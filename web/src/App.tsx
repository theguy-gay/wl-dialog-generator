import DialogEditor from './components/DialogEditor';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>WL Dialog Generator</h1>
        <p>Visual dialog flow editor for WildLife sandbox scripts</p>
      </header>
      <main className="app-main">
        <DialogEditor />
      </main>
    </div>
  );
}

export default App;
