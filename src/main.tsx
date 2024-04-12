import ReactDOM from 'react-dom/client'
import './styles/index.css'
import './styles/button.css'
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import Viewer from "./components/Viewer";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <>
        <Viewer />
        <ToastContainer />
    </>
)


