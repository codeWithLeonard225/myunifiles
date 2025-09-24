
// src/pages/Report.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";

const StudentReport = () => {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({
    byInstitution: {},
    byCourse: {},
    byLevel: {},
  });
  const COLLECTION_NAME = "Registration"; // same as your registration collection

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
      generateSummary(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch students.");
    }
  };

  const generateSummary = (data) => {
    const byInstitution = {};
    const byCourse = {};
    const byLevel = {};

    data.forEach((student) => {
      // Count by institution
      if (student.institution) {
        byInstitution[student.institution] = (byInstitution[student.institution] || 0) + 1;
      }
      // Count by course
      if (student.course) {
        byCourse[student.course] = (byCourse[student.course] || 0) + 1;
      }
      // Count by Level (assuming Level is stored in student.Level)
      if (student.Level) {
        byLevel[student.Level] = (byLevel[student.Level] || 0) + 1;
      }
    });

    setSummary({ byInstitution, byCourse, byLevel });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      toast.success("Student deleted successfully!");
      fetchStudents();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete student.");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-6 text-indigo-700">Student Report</h1>

      {/* Summary Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">By Institution</h3>
            <ul>
              {Object.entries(summary.byInstitution).map(([key, value]) => (
                <li key={key}>{key}: {value}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">By Course</h3>
            <ul>
              {Object.entries(summary.byCourse).map(([key, value]) => (
                <li key={key}>{key}: {value}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">By Level</h3>
            <ul>
              {Object.entries(summary.byLevel).map(([key, value]) => (
                <li key={key}>{key}: {value}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white p-4 rounded shadow overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">All Students</h2>
        <table className="w-full table-auto border border-gray-300">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 border">Student ID</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Institution</th>
              <th className="px-4 py-2 border">Course</th>
              <th className="px-4 py-2 border">Level</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="text-center">
                <td className="px-4 py-2 border">{student.studentID}</td>
                <td className="px-4 py-2 border">{student.studentName}</td>
                <td className="px-4 py-2 border">{student.institution}</td>
                <td className="px-4 py-2 border">{student.course}</td>
                <td className="px-4 py-2 border">{student.Level}</td>
                <td className="px-4 py-2 border">
                  <button
                    onClick={() => handleDelete(student.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center">No students found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentReport;
