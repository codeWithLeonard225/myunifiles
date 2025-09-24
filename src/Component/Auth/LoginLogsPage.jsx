import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase"; // adjust path

const LoginLogsPage = () => {
    const [studentLogs, setStudentLogs] = useState([]);
    const [adminLogs, setAdminLogs] = useState([]);
    const [ceoLogs, setCeoLogs] = useState([]);

    useEffect(() => {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const logsQuery = query(
            collection(db, "LoginLogs"),
            where("loggedInAt", ">=", startOfDay)
        );

        const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
            const logs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            // sort latest first
            logs.sort((a, b) => b.loggedInAt?.seconds - a.loggedInAt?.seconds);

            setStudentLogs(logs.filter((log) => log.role?.toLowerCase() === "student"));
            setAdminLogs(logs.filter((log) => log.role?.toLowerCase() === "admin"));
            setCeoLogs(logs.filter((log) => log.role?.toLowerCase() === "ceo"));

        });

        return () => unsubscribe();
    }, []);

    // 🔹 Reusable table
    const LogsTable = ({ title, logs, columns }) => (
        <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">{title}</h2>
            {logs.length === 0 ? (
                <p className="text-gray-500">No logins today.</p>
            ) : (
                <table className="min-w-full border border-gray-300 text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            {columns.map((col) => (
                                <th key={col.key} className="border px-3 py-2 text-left">
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                {columns.map((col) => (
                                    <td key={col.key} className="border px-3 py-2">
                                        {col.render ? col.render(log) : log[col.key] || "—"}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Today's Login Logs</h1>
            <div className="">
                {/* Students */}
                <LogsTable
                    title="Students"
                    logs={studentLogs}
                    columns={[
                        { key: "studentID", label: "ID" },
                        { key: "studentName", label: "Name" },
                        { key: "institution", label: "Institution" },
                        { key: "course", label: "Course" },
                        {
                            key: "loggedInAt",
                            label: "Time",
                            render: (log) =>
                                log.loggedInAt?.toDate
                                    ? log.loggedInAt.toDate().toLocaleTimeString()
                                    : "—",
                        },
                    ]}
                />

                {/* Admins */}
                <LogsTable
                    title="Admins"
                    logs={adminLogs}
                    columns={[
                        { key: "adminID", label: "ID" },
                        { key: "adminName", label: "Name" },
                        {
                            key: "loggedInAt",
                            label: "Time",
                            render: (log) =>
                                log.loggedInAt?.toDate
                                    ? log.loggedInAt.toDate().toLocaleTimeString()
                                    : "—",
                        },
                    ]}
                />

                {/* CEOs */}
                <LogsTable
                    title="CEOs"
                    logs={ceoLogs}
                    columns={[
                        { key: "ceoID", label: "ID" },
                        { key: "ceoName", label: "Name" },
                        {
                            key: "loggedInAt",
                            label: "Time",
                            render: (log) =>
                                log.loggedInAt?.toDate
                                    ? log.loggedInAt.toDate().toLocaleTimeString()
                                    : "—",
                        },
                    ]}
                />
            </div>
        </div>
    );
};

export default LoginLogsPage;
