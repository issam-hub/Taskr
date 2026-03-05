/**
 * Seed Script
 * -----------
 * Creates roles (Backend Developer, Frontend Developer, Project Manager)
 * and 5 sample users mapped to those roles via the REST API.
 *
 * Run with:  npx tsx src/utils/seed.ts
 *
 * Requirements:
 *   - Server must be running (npm run start)
 *   - A SuperAdmin user must exist (created via npm run start -- --init)
 *   - .env must contain DEFAULT_USER_EMAIL and DEFAULT_USER_PASSWORD
 */

import { loadEnvFile } from "process";

// ─── Config ──────────────────────────────────────────────────────────────────

loadEnvFile();

const BASE_URL = `http://localhost:${process.env.PORT ?? 3000}`;
const ADMIN_EMAIL = process.env.DEFAULT_USER_EMAIL as string;
const ADMIN_PASSWORD = process.env.DEFAULT_USER_PASSWORD as string;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(
        "❌  DEFAULT_USER_EMAIL and DEFAULT_USER_PASSWORD must be set in your .env file.",
    );
    process.exit(1);
}

// ─── Rights (derived from src/utils/common.ts > Rights) ──────────────────────

const Rights = {
    ROLES: {
        ADD: "add_role",
        EDIT: "edit_role",
        GET_ALL: "get_all_roles",
        GET_DETAILS: "get_details_role",
        DELETE: "delete_role",
    },
    USERS: {
        ADD: "add_user",
        EDIT: "edit_user",
        GET_ALL: "get_all_users",
        GET_DETAILS: "get_details_user",
        DELETE: "delete_user",
    },
    PROJECTS: {
        ADD: "add_project",
        EDIT: "edit_project",
        GET_ALL: "get_all_projects",
        GET_DETAILS: "get_details_project",
        DELETE: "delete_project",
    },
    TASKS: {
        ADD: "add_task",
        EDIT: "edit_task",
        GET_ALL: "get_all_tasks",
        GET_DETAILS: "get_details_task",
        DELETE: "delete_task",
    },
    COMMENTS: {
        ADD: "add_comment",
        EDIT: "edit_comment",
        GET_ALL: "get_all_comments",
        GET_DETAILS: "get_details_comment",
        DELETE: "delete_comment",
    },
};

// ─── Role Definitions ─────────────────────────────────────────────────────────

const rolesToCreate = [
    {
        name: "Backend Developer",
        description:
            "Handles server-side logic, APIs and database. Full access to tasks and comments, read access on projects.",
        rights: [
            // Tasks – full access
            Rights.TASKS.ADD,
            Rights.TASKS.EDIT,
            Rights.TASKS.GET_ALL,
            Rights.TASKS.GET_DETAILS,
            Rights.TASKS.DELETE,
            // Comments – full access
            Rights.COMMENTS.ADD,
            Rights.COMMENTS.EDIT,
            Rights.COMMENTS.GET_ALL,
            Rights.COMMENTS.GET_DETAILS,
            Rights.COMMENTS.DELETE,
            // Projects – read only
            Rights.PROJECTS.GET_ALL,
            Rights.PROJECTS.GET_DETAILS,
            // Users – read only
            Rights.USERS.GET_ALL,
            Rights.USERS.GET_DETAILS,
        ],
    },
    {
        name: "Frontend Developer",
        description:
            "Builds UI components and integrates APIs. Read access on tasks, comments and projects, can add/edit comments.",
        rights: [
            // Tasks – read only
            Rights.TASKS.GET_ALL,
            Rights.TASKS.GET_DETAILS,
            // Comments – contribute
            Rights.COMMENTS.ADD,
            Rights.COMMENTS.EDIT,
            Rights.COMMENTS.GET_ALL,
            Rights.COMMENTS.GET_DETAILS,
            // Projects – read only
            Rights.PROJECTS.GET_ALL,
            Rights.PROJECTS.GET_DETAILS,
            // Users – read only
            Rights.USERS.GET_ALL,
            Rights.USERS.GET_DETAILS,
        ],
    },
    {
        name: "Project Manager",
        description:
            "Oversees project delivery. Full access on projects, tasks, comments and users management.",
        rights: [
            // Projects – full access
            Rights.PROJECTS.ADD,
            Rights.PROJECTS.EDIT,
            Rights.PROJECTS.GET_ALL,
            Rights.PROJECTS.GET_DETAILS,
            Rights.PROJECTS.DELETE,
            // Tasks – full access
            Rights.TASKS.ADD,
            Rights.TASKS.EDIT,
            Rights.TASKS.GET_ALL,
            Rights.TASKS.GET_DETAILS,
            Rights.TASKS.DELETE,
            // Comments – full access
            Rights.COMMENTS.ADD,
            Rights.COMMENTS.EDIT,
            Rights.COMMENTS.GET_ALL,
            Rights.COMMENTS.GET_DETAILS,
            Rights.COMMENTS.DELETE,
            // Users – manage
            Rights.USERS.ADD,
            Rights.USERS.EDIT,
            Rights.USERS.GET_ALL,
            Rights.USERS.GET_DETAILS,
            Rights.USERS.DELETE,
            // Roles – read only
            Rights.ROLES.GET_ALL,
            Rights.ROLES.GET_DETAILS,
        ],
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(
    path: string,
    method: string,
    body?: unknown,
    token?: string,
): Promise<T> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const options: RequestInit = { method, headers };
    if (body !== undefined) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, options);

    const json = (await res.json()) as T;
    return json;
}

// ─── Step 1: Login ────────────────────────────────────────────────────────────

async function login(): Promise<string> {
    console.log(`\n🔐  Logging in as ${ADMIN_EMAIL} …`);

    const result = await apiFetch<any>("/api/login", "POST", {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
    });

    if (result.statusCode !== 200) {
        throw new Error(
            `Login failed (${result.statusCode}): ${result.message ?? JSON.stringify(result)}`,
        );
    }

    console.log("✅  Logged in successfully.");
    return result.data.accessToken as string;
}

// ─── Step 2: Create Roles ─────────────────────────────────────────────────────

async function createRoles(
    token: string,
): Promise<Record<string, string>> {
    console.log("\n📋  Creating roles …");
    const roleIds: Record<string, string> = {};

    for (const role of rolesToCreate) {
        const result = await apiFetch<any>("/api/roles", "POST", role, token);

        if (result.statusCode === 201) {
            const id: string = result.data.role_id;
            roleIds[role.name] = id;
            console.log(`  ✅  Created role "${role.name}" → id: ${id}`);
        } else if (result.statusCode === 409) {
            console.log(`  ⚠️   Role "${role.name}" already exists — fetching its id …`);
            // Fetch existing role by name
            const getResult = await apiFetch<any>(
                `/api/roles?name=${encodeURIComponent(role.name)}`,
                "GET",
                undefined,
                token,
            );
            if (getResult.statusCode === 200 && getResult.data?.length > 0) {
                const id: string = getResult.data[0].role_id;
                roleIds[role.name] = id;
                console.log(`  ℹ️   Using existing role "${role.name}" → id: ${id}`);
            } else {
                console.error(
                    `  ❌  Could not retrieve existing role "${role.name}":`,
                    getResult,
                );
            }
        } else {
            console.error(
                `  ❌  Failed to create role "${role.name}" (${result.statusCode}):`,
                result.message ?? result,
            );
        }
    }

    return roleIds;
}

// ─── Step 3: Create Users ─────────────────────────────────────────────────────

function buildUsers(roleIds: Record<string, string>) {
    const backendId = roleIds["Backend Developer"];
    const frontendId = roleIds["Frontend Developer"];
    const pmId = roleIds["Project Manager"];

    return [
        {
            fullname: "Alice Martin",
            username: "alice.martin",
            email: "alice.martin@taskr.dev",
            password: "Alice@1234",
            role_id: pmId,
        },
        {
            fullname: "Bob Chen",
            username: "bob.chen",
            email: "bob.chen@taskr.dev",
            password: "Bob@12345",
            role_id: backendId,
        },
        {
            fullname: "Clara Diaz",
            username: "clara.diaz",
            email: "clara.diaz@taskr.dev",
            password: "Clara@1234",
            role_id: backendId,
        },
        {
            fullname: "David Kim",
            username: "david.kim",
            email: "david.kim@taskr.dev",
            password: "David@1234",
            role_id: frontendId,
        },
        {
            fullname: "Eva Rossi",
            username: "eva.rossi",
            email: "eva.rossi@taskr.dev",
            password: "Eva@12345",
            role_id: frontendId,
        },
    ];
}

async function createUsers(
    token: string,
    roleIds: Record<string, string>,
): Promise<void> {
    console.log("\n👥  Creating users …");
    const users = buildUsers(roleIds);

    for (const user of users) {
        if (!user.role_id) {
            console.error(
                `  ❌  Skipping user "${user.username}" — role ID not resolved.`,
            );
            continue;
        }

        const result = await apiFetch<any>("/api/users", "POST", user, token);

        if (result.statusCode === 201) {
            const role = Object.entries(roleIds).find(
                ([, id]) => id === user.role_id,
            )?.[0];
            console.log(
                `  ✅  Created user "${user.fullname}" (${user.email}) → role: ${role}`,
            );
        } else if (result.statusCode === 409) {
            console.log(`  ⚠️   User "${user.username}" already exists — skipping.`);
        } else {
            console.error(
                `  ❌  Failed to create user "${user.username}" (${result.statusCode}):`,
                result.message ?? result,
            );
        }
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log("🌱  Taskr Seed Script");
    console.log("═".repeat(40));

    try {
        const token = await login();
        const roleIds = await createRoles(token);

        if (Object.keys(roleIds).length === 0) {
            throw new Error("No roles were created or resolved. Aborting user creation.");
        }

        await createUsers(token, roleIds);

        console.log("\n🎉  Seeding complete!\n");
    } catch (err: any) {
        console.error("\n💥  Seed failed:", err.message);
        process.exit(1);
    }
}

main();
