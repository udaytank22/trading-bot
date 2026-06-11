import { API_ENDPOINTS } from '../apiService';
import { apiGet, apiPost } from '../apiHelper';

export const getInquiriesList = async (data?: any) => {
    try {
        const response = await apiGet(
            API_ENDPOINTS.INQUIRIES.BASE,
            data,
        );
        console.log(response, 'response');

        if (response?.success) {
            return response.data; // Return data if successful
        } else {
            return []; // Return an empty array if no data
        }
    } catch (error: unknown) {
        if (error instanceof Error)
            console.error('Error fetching inquiries data:', error.message);
        throw error; // Propagate the error if needed
    }
};