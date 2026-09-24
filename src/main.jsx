import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {createBrowserRouter, RouterProvider} from 'react-router-dom'
import Products from './Pages/Products.jsx'
import ProductDetails from './Pages/ProductDetails.jsx'
import ProductForm from './Pages/ProductForm.jsx'
import Login from './Pages/Login.jsx' 
import ProtectedRoute from './components/ProtectedRoute.jsx' 


const router = createBrowserRouter([
  {
    element:<App/>,
    path:"/"
  },

  {
    element:<ProtectedRoute><Products/></ProtectedRoute>,
    path:"/products"
  },
  {
    element:<ProtectedRoute><ProductDetails/></ProtectedRoute>,
    path:"/products/:id"
  },
  {
    element:<ProtectedRoute><ProductForm/></ProtectedRoute>,
    path:"/products/new"
  },
  {
    element:<Login/>,
    path:"/login"
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
