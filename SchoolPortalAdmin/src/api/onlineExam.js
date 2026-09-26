import { axiosInstance } from "../CustomAxios";

export const getAllExams = async (data) => {
    try {
        const queryParams = data?.queryKey?.[1] ?? (Array.isArray(data) ? data[1] : data) ?? {};
        const response = await axiosInstance.get(`v1/onlineExam/exam`, {
            params: queryParams
        });
        return response?.data?.data
    } catch (error) {
        throw error
    }

}

export const newExam = async (data) => {
    try {
        const response = await axiosInstance.post(`v1/onlineExam/exam`, data);
        return response?.data?.data
    } catch (error) {
        throw error
    }
}

export const updateExam = async (data) => {

    //console.log({update: data})
    //return false;
    try {
        const response = await axiosInstance.patch(`v1/onlineExam/exam/${data?.id}`, data);
        return response?.data?.data
    } catch (error) {

    }
}

export const deleteExam = async (id) => {
    console.log({id})
    try {
        const response = await axiosInstance.delete(`v1/onlineExam/exam/${id}`);
        return response?.data?.data
    } catch (error) {
        throw error
    }
}

export const listAllPublishedExams = async (data) => {
    // console.log({data})
    try {
        const response = await axiosInstance.get(`v1/onlineExam/publish`, {
            params: { slug: data}
        });
        return response?.data
    } catch (error) {
        throw error
    }
}

export const viewPublishedExam = async (id) => {
    try {
        const response = await axiosInstance.get(`v1/onlineExam/publish/${id}`);
        return response?.data?.data
    } catch (error) {
        throw error
    }
}

//Update Publish Exam
export const updatePublishedExam = async (data) => {
    try {
        console.log({datas: data})
        const response = await axiosInstance.put(`v1/onlineExam/publish/${data?.id}`, data);
        return response?.data?.data
    } catch (error) {
        throw error
    }
}

//Delete Published Exam
export const deletePublishedExam = async (id) => {
    try {
        const response = await axiosInstance.delete(`v1/onlineExam/publish/${id}`);
        return response?.data?.data
    } catch (error) {
        throw error
    }
}

//Get Attended unattended students
export const getAttendedUnattendedStudents = async (id) => {
    try {
        const response = await axiosInstance.get(`v1/onlineExam/attendedUnAttendedStudents/${id}`);
        return response?.data?.data
    } catch (error) {
        throw error
    }
}

//Publlish Retest
//Get Exam Report based on examId and StudentPerformance
export const getExamReport = async (examId) => {
    try {
        const response = await axiosInstance.get(`v1/onlineExam/report/${examId}`);
        return response?.data?.data
    } catch (error) {
        throw error
    }
}

export const publishRetest = async (data) => {
    try {
        const response = await axiosInstance.post(`v1/onlineExam/retest`, data);
        return response?.data?.data
    } catch (error) {
        throw error
    }
}



// Get all question banks for main question bank screen
export const getAllQuestionBanks = async (data) => {
    try {
        const response = await axiosInstance.get(`v1/onlineExam/question_bank`, {
            params: data
        });
        return response?.data?.data
    } catch (error) {
        throw error
    }
}

export const viewQuestionBank = async (id) => {
    try {
        const response = await axiosInstance.get(`v1/onlineExam/question_bank/${id}`);
        return response?.data?.data
    } catch (error) {
        throw error
    }
}

export const newQuestionBank = async (data) => {
    try {
        const response = await axiosInstance.post(`v1/onlineExam/question_bank`, data);
        return response?.data?.data
    } catch (error) {
        throw error
    }
}

export const updateQuestionBank = async (data) => {
    try {
        const response = await axiosInstance.patch(`v1/onlineExam/question_bank/${data?.id}`, data);
        return response?.data?.data
    } catch (error) {
        throw error
    }
}

export const viewExam = async (id) => {
    try {
        const response = await axiosInstance.get(`v1/onlineExam/exam/${id}`);
        return response?.data?.data
    } catch (error) {
        throw error
    }
}

export const newQuestion = async (data) => {
    try {
        const response = await axiosInstance.post(`v1/onlineExam/question`, data);
        return response?.data?.data
    } catch (error) {
        throw error
    }
}

export const deleteQuestions = async (id) => {
    try {
        const response = await axiosInstance.delete(`v1/onlineExam/question/${id}`);
        return response?.data?.data
    } catch (error) {
        throw error
    }
}

export const getNotPublishedSections = async(examId, gender) => {
    try {
        const response = await axiosInstance.get(`v1/onlineExam/getNotPublishedSections?examId=${examId}&gender=${gender}`);
        return response?.data?.data
    } catch (error) {
        throw error
    }
}


export const publishExam = async(data) => {
    try {
        const response = await axiosInstance.post(`v1/onlineExam/publish`, data);
        return response?.data?.data
    } catch (error) {
        throw error
    }
}

