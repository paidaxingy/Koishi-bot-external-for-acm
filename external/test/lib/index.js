"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.Config = exports.name = void 0;
const koishi_1 = require("koishi");
exports.name = 'test';
exports.Config = koishi_1.Schema.object({});
function apply(ctx) {
    ctx.on('message', (session) => {
        if (session.content === 'op') {
            session.send('原神怎么你了');
        }
    });
}
exports.apply = apply;
