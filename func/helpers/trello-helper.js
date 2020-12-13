const fetch = require("node-fetch");

const Trello = {
    BASE_URL: 'https://api.trello.com/1',
    KEY: process.env.TRELLO_KEY,
    TOKEN: process.env.TRELLO_TOKEN,
    ID_BOARD_FRENCH: '5c83fd2dd8cb02816b43dc00',
    ID_LIST_TODO: '5c83fd33cd3b4d50de63913e',
    ID_LIST_VOTES: '5c84253c8278d96398595e38',
    BOARD_URL: `https://trello.com/b/${process.env.TRELLO_BOARD_ID}`,

    call: async (uri, data, method) => {
        data = Object.assign({key: Trello.KEY, token: Trello.TOKEN}, (data || {}));
        method = method || 'GET';

        if (!uri.startsWith('/')) {
            uri = `/${uri}`;
        }

        data = Object.keys(data)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
            .join('&');

        const queryConfig = {
            method: method.toUpperCase()
        };

        const response = await fetch(`${Trello.BASE_URL}${uri}?${data}`, queryConfig).catch(exception => {
            console.log(exception);
            throw exception;
        });

        return response.json();
    }
}


module.exports = Trello;
