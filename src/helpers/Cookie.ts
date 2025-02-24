import express from "express";
import { CookieKeys } from "../constants";
const Cookie = {
    setCookie: (key: string, value: string, response: express.Response, options = {
        httpOnly: true,
        maxAge: 15 * 60 * 1000,
    }) => {
        response.cookie(key, value, {
            sameSite: "strict",
            path: "/",
            secure: process.env.NODE_ENV === "production",
            ...options
        });
    },
    clearCookie: (key: string, response: express.Response) => {
        response.clearCookie(key, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
    },
    clearAllCookies: (response: express.Response) => {
        Object.values(CookieKeys).forEach((key) => {
            Cookie.clearCookie(key, response);
        });
    }
}
export default Cookie;