import * as SecureStore from "expo-secure-store";
import api from "../api/api";

const refreshToken = async () => {
    try {
        const storedRefreshToken = await SecureStore.getItemAsync('refreshToken');
        const response = await api.post('/auth/refresh', { refreshToken: storedRefreshToken });

        if (response.data.success) {
            const { accessToken } = response.data;
            await SecureStore.setItemAsync('userToken', JSON.stringify(accessToken));
            return accessToken;
        } else {
            throw new Error(response.data.message || '토큰 갱신 실패');
        }
    } catch (error) {
        console.error('토큰 갱신 오류:', error);
        throw error;
    }
};



export default refreshToken;
