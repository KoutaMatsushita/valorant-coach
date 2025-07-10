import {defineConfig} from 'orval';

export default defineConfig({
    valorant: {
        input: 'https://app.swaggerhub.com/apiproxy/registry/Henrik-3/HenrikDev-API/4.2.0',
        output: {
            mode: 'split',
            target: 'src/api/valorant.ts',
            baseUrl: 'https://api.henrikdev.xyz',
            client: 'fetch',
            override: {
                mutator: {
                    path: './src/api/mutator/custom-instance.ts',
                    name: 'customInstance',
                },
            },
        },
    },
    valorantZod: {
        input: 'https://app.swaggerhub.com/apiproxy/registry/Henrik-3/HenrikDev-API/4.2.0',
        output: {
            mode: 'split',
            client: 'zod',
            target: 'src/api/valorant.ts',
            fileExtension: '.zod.ts',
        },
    },
})
