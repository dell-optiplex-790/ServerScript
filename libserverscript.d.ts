import type _fs from 'node:fs';
import type _path from 'node:path';

type Data = string | number | Record<string, Data> | Array<Data>;

type Files = {
    readonly [Prop in string]?: Array<{
        size: number;
        filepath: string;
        originalFilename?: string;
        newFilename: string;
        toString: () => string;
    }>;
}

declare const script: {
    exports: string;
    log: string;
}

declare const debug: {
    log: (msg: string) => void;
}

declare const http: {
    formData: Record<string, Data>;
    files: Files;
    formError: boolean;
    method: 'GET' | 'POST'; // these aren't all the http methods out there but still
    status: number;
    query: Record<string, string>;
    cookies: Record<string, string>;
}

declare const base64: {
    encode: (input: string) => string;
    decode: (input: string) => string;
}

declare const filesystem: typeof _fs;
declare const path: typeof _path;
declare const publicDir: string;
declare const jsdir: string;


export {}