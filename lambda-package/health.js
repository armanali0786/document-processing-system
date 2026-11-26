"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const handler = async () => {
    console.log("Health check Lambda invoked");
    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            success: true,
            message: "Document Processing API is running",
        }),
    };
};
exports.handler = handler;
