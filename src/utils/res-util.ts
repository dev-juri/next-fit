export function successResponse({
    message,
    data,
}: {
    message: string;
    data?: any;
}): IResponse {
    return {
        success: true,
        message,
        data,
    };
}

export interface IResponse {
    success: boolean;
    message: string;
    data?: any;
}