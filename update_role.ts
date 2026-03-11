import * as mysql from "mysql2/promise";

async function main() {
    const connection = await mysql.createConnection("mysql://root:password@localhost:3306/uksabor");

    console.log("Updating user roles...");
    const [result] = await connection.execute(
        `UPDATE users SET roles = '["user", "admin", "instructor", "promoter"]' WHERE email = 'lammertpetterx22@gmail.com'`
    );

    console.log("MySQL Response:", result);
    console.log("Successfully updated Lammert's account to admin/instructor!");
    await connection.end();
    process.exit(0);
}

main().catch(console.error);
