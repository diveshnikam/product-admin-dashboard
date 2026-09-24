import api from './axios'

 const loginUser = async (userData) => {
    const response = await api.post('/auth/login', userData)

    return response.data
}

export default loginUser;