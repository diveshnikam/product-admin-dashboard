import axios from 'axios'

const api = axios.create({
    baseURL: 'https://dummyjson.com',
    headers: {
        'Content-Type': 'application/json'
    }
})

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken')

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response Interceptor
api.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        const message = error.response?.data?.message || error.message || 'Something went wrong'

        const apiError = new Error(message)
        apiError.status = error.response?.status

        return Promise.reject(apiError)
    }
)

export default api