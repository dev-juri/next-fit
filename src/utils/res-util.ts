export function successResponse({
    message,
    data,
}: {
    message: string;
    data?: any;
}): IResponse {
    return {
        status: "success",
        message,
        data,
    };
}

export interface IResponse {
    status: string;
    message: string;
    data?: any;
}