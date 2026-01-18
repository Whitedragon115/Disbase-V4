require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const adapter = new PrismaMariaDb({
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

const prisma = new PrismaClient({ adapter });

async function newFile(uuid, data){
    return await prisma.files.create({
        data: {
            uuid: uuid,
            size: data.size,
            name: data.name,
            time: data.time,
        }
    })
}

module.exports = {
    prisma,
    adapter,
    newFile
};

