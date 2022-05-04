type FreetunnelResponse = {
    url: string;
    headers: {
        host: string;
        'x-forwarded-proto': string;
        'x-forwarded-host': string;
        'x-forwarded-port': string;
        'x-forwarded-for': string;
        connection: 'upgrade';
        [key: string]: string;
    };
    body: Record<string, unknown>;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE';
    uuid: number;
    time: Date;
    result: {
        data: Record<string, unknown>;
        status: number;
        headers: import('node:http').IncomingHttpHeaders;
    };
};
