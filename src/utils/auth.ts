import * as jwt from "jsonwebtoken";


export const APP_SECRET = "r2s:access2Postgress$@localhost:5432/mydb?s-hema=public";

export interface AuthTokenPayload {
    userId: number;
}

export function decodeAuthHeader(authHeader: String): AuthTokenPayload {
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
        throw new Error("NO TOKEN FOUND BITCH")
    }
    return jwt.verify(token, APP_SECRET) as AuthTokenPayload;
}


