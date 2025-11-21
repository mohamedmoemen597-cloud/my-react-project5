
import React, { useContext } from 'react';
import { AppContext } from './context/AppContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Exam from './components/Exam';
import Results from './components/Results';
import Header from './components/Header';

const App: React.FC = () => {
  const { view, student } = useContext(AppContext);

  const renderView = () => {
    switch (view) {
      case 'login':
        return <Login />;
      case 'dashboard':
        return <Dashboard />;
      case 'exam':
        return <Exam />;
      case 'results':
        return <Results />;
      default:
        return <Login />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-gray-800 selection:bg-blue-500 selection:text-white">
      <div className="fixed inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      {student && <Header />}
      <main className={`transition-opacity duration-500 ${student ? 'pt-24' : ''}`}>
        <div className="container mx-auto px-4 md:px-8">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;