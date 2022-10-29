export interface AuthUser {
    token_type: string;
    access_token: string;
    refresh_token: string;
    expires_in: number;
    payload: any;
}
