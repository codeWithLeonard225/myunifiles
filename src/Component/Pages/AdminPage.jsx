// src/pages/Admin.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // 👈 Import useLocation
import { toast } from "react-toastify";
import { db } from "../../../firebase";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    getDocs,
} from "firebase/firestore";

import CameraCapture from "../CaptureCamera/CameraCapture";
import CloudinaryImageUploader from "../CaptureCamera/CloudinaryImageUploader";

const COLLECTION_NAME = "PastQuestions";


const SEMESTERS = ["Semester 1", "Semester 2", "Summer Session"];

// Validation helper 
const validateField = (name, value) => {
    switch (name) {
        case "studentName":
            if (!value || value.trim().length < 3)
                return "Student name must be at least 3 characters.";
            break;
        case "course":
            if (!value) return "Course selection is required.";
            break;
        case "Level":
            if (!value) return "Level selection is required.";
            break;
        case "Semester":
            if (!value) return "Semester selection is required.";
            break;
        case "Module":
            if (!value) return "Module selection is required.";
            break;
        case "academicYear":
            if (!value) return "Academic Year selection is required.";
            break;
        default:
            return "";
    }
    return "";
};

const ErrorMessage = ({ message }) => (
    <p className="text-red-500 text-xs mt-1 font-medium">{message}</p>
);

const AdminPage = () => {
    // 🔑 NEW: Get location state which contains the logged-in admin user data
    const location = useLocation();
    const adminUser = location.state?.user || {};

    const [formData, setFormData] = useState({
        // 🔑 MODIFIED: Initialize with logged-in admin user data
        studentID: adminUser.studentID || "",
        studentName: adminUser.studentName || "",
        Courses: [],
        Level: "",
        Semester: "",
        Module: "",
        academicYear: "",
        registrationDate: new Date().toISOString().slice(0, 10),
        registeredBy: adminUser.studentName || "Admin", // 🔑 MODIFIED: Use admin's name
        userPhoto: null,
        userPublicId: null,
    });

    const [records, setRecords] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showCamera, setShowCamera] = useState(false);
    const [modules, setModules] = useState([]);
    const [courses, setCourses] = useState([]);
    const [levels, setLevels] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);


    // Fetch data from Firestore in realtime 
    useEffect(() => {
        const q = query(collection(db, COLLECTION_NAME), orderBy("registrationDate", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setRecords(data);
        });
        return () => unsubscribe();
    }, []);


    // 🔽 Fetch Levels & Academic Years dynamically
    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const modulesSnap = await getDocs(collection(db, "Modules"));
                const coursesSnap = await getDocs(collection(db, "Courses"));
                const levelsSnap = await getDocs(collection(db, "Levels"));
                const yearsSnap = await getDocs(collection(db, "AcademicYears"));

                setModules(modulesSnap.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().moduleName,
                })));

                setCourses(coursesSnap.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().courseName,
                })));

                setLevels(levelsSnap.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().levelName,
                })));

                setAcademicYears(yearsSnap.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().yearName,
                })));

            } catch (err) {
                console.error(err);
                toast.error("Failed to load dropdown data");
            }
        };

        fetchDropdowns();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const newData = { ...formData, [name]: value };
        setFormData(newData);
        setValidationErrors({
            ...validationErrors,
            [name]: validateField(name, value),
        });
    };

    const handleUploadSuccess = (url, publicId) => {
        setFormData({ ...formData, userPhoto: url, userPublicId: publicId });
        setIsUploading(false);
        toast.success("Image uploaded successfully!");
    };

    const handleCameraCapture = (url) => {
        setFormData({ ...formData, userPhoto: url });
        setShowCamera(false);
        toast.success("Photo captured successfully!");
    };

    const validateForm = () => {
        const errors = {};
        let valid = true;

        if (!formData.Module) {
            errors.Module = "Module selection is required.";
            valid = false;
        }
        if (!formData.Level) {
            errors.Level = "Level selection is required.";
            valid = false;
        }
        if (!formData.Semester) {
            errors.Semester = "Semester selection is required.";
            valid = false;
        }
        if (!formData.Courses || formData.Courses.length === 0) {
            errors.Courses = "At least one Dept is required.";
            valid = false;
        }
        if (!formData.academicYear) {
            errors.academicYear = "Academic Year selection is required.";
            valid = false;
        }
        if (!formData.userPhoto) {
            toast.error("Photo is required!");
            valid = false;
        }

        setValidationErrors(errors);
        return valid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setIsSubmitting(true);

        try {
            const dataToSave = {
                ...formData,
                userPhotoUrl: formData.userPhoto,
            };

            delete dataToSave.userPhoto;

            if (formData.id) {
                // Update 
                const docRef = doc(db, COLLECTION_NAME, formData.id);
                await updateDoc(docRef, dataToSave);
                toast.success("Student updated successfully! 🎉");
            } else {
                // Add new 
                await addDoc(collection(db, COLLECTION_NAME), {
                    ...dataToSave,
                    Courses: formData.Courses, // 👈 saves as array
                    timestamp: new Date(),
                });
                toast.success("Student registered successfully! 🎉");
            }

            setFormData({
                // 🔑 MODIFIED: Preserve admin's ID and Name after submission
                studentID: adminUser.studentID || "",
                studentName: adminUser.studentName || "",
                Courses: [],  
                Level: "",
                Semester: "",
                Module: "",
                academicYear: "",
                registrationDate: new Date().toISOString().slice(0, 10),
                registeredBy: adminUser.studentName || "Admin",
                userPhoto: null,
                userPublicId: null,
            });
        } catch (err) {
            console.error(err);
            toast.error("Failed to submit form. Try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (record) => {
        setFormData({
            ...record,
            userPhoto: record.userPhotoUrl,
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
            toast.success("Record deleted successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete record.");
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
            {/* Form */}
            <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-2xl mb-6">
                <h2 className="text-2xl font-bold text-center mb-6 text-indigo-700">
                    Admin Student Data Entry
                </h2>

                {/* Student ID & Name */}
                {/* 🔑 MODIFIED: Added readOnly to Admin's ID and Name inputs */}
                <div className="flex flex-col md:flex-row md:space-x-4 mb-4">
                    <div className="flex-1 mb-4 md:mb-0">
                        <label className="block mb-1">Admin ID (Logged In)</label>
                        <input
                            type="text"
                            name="studentID"
                            value={formData.studentID}
                            // Only allow input when editing a record, otherwise it's the admin's ID
                            onChange={formData.id ? handleInputChange : undefined}
                            readOnly={!formData.id} // Make read-only when creating a new record
                            className={`w-full p-2 border rounded ${!formData.id ? "bg-gray-100 text-gray-500" : ""}`}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block mb-1">Admin Name (Logged In)</label>
                        <input
                            type="text"
                            name="studentName"
                            value={formData.studentName}
                            // Only allow input when editing a record, otherwise it's the admin's Name
                            onChange={formData.id ? handleInputChange : undefined}
                            readOnly={!formData.id} // Make read-only when creating a new record
                            className={`w-full p-2 border rounded ${!formData.id ? "bg-gray-100 text-gray-500" : ""}`}
                        />
                        {validationErrors.studentName && (
                            <ErrorMessage message={validationErrors.studentName} />
                        )}
                    </div>
                </div>

                {/* Course + Level */}
                <div className="flex flex-col md:flex-row md:space-x-4 mb-4">
                    <div className="mb-4">
                        <label className="block mb-1">Dept *</label>
                        {(formData.Courses || []).map((course, index) => (
                            <div key={index} className="flex space-x-2 mb-2">
                                <select
                                    value={course}
                                    onChange={(e) => {
                                        const newCourses = [...formData.Courses];
                                        newCourses[index] = e.target.value;
                                        setFormData({ ...formData, Courses: newCourses });
                                    }}
                                    className="flex-1 p-2 border rounded"
                                >
                                    <option value="">Select Dept</option>
                                    {courses.map((c) => (
                                        <option key={c.id} value={c.name}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newCourses = formData.Courses.filter((_, i) => i !== index);
                                        setFormData({ ...formData, Courses: newCourses });
                                    }}
                                    className="px-3 py-1 bg-red-500 text-white rounded"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() =>
                                setFormData({ ...formData, Courses: [...formData.Courses, ""] })
                            }
                            className="mt-2 px-3 py-1 bg-green-600 text-white rounded"
                        >
                            + Add Dept
                        </button>

                        {validationErrors.Courses && (
                            <ErrorMessage message={validationErrors.Courses} />
                        )}
                    </div>

                    {/* Level */}
                    <div className="flex-1">
                        <label className="block mb-1">Level *</label>
                        <select
                            name="Level"
                            value={formData.Level}
                            onChange={handleInputChange}
                            className={`w-full p-2 border rounded ${validationErrors.Level ? "border-red-500" : "border-gray-300"}`}
                        >
                            <option value="">Select Level</option>
                            {levels.map(l => (
                                <option key={l.id} value={l.name}>{l.name}</option>
                            ))}
                        </select>
                        {validationErrors.Level && <ErrorMessage message={validationErrors.Level} />}
                    </div>
                </div>

                {/* Semester + Module */}
                <div className="flex flex-col md:flex-row md:space-x-4 mb-4">
                    <div className="flex-1 mb-4 md:mb-0">
                        <label className="block mb-1">Semester *</label>
                        <select
                            name="Semester"
                            value={formData.Semester}
                            onChange={handleInputChange}
                            className={`w-full p-2 border rounded ${validationErrors.Semester ? "border-red-500" : "border-gray-300"}`}
                        >
                            <option value="">Select Semester</option>
                            {SEMESTERS.map((sem) => (
                                <option key={sem} value={sem}>{sem}</option>
                            ))}
                        </select>
                        {validationErrors.Semester && <ErrorMessage message={validationErrors.Semester} />}
                    </div>
                    <div className="flex-1">
                        <label className="block mb-1">Module *</label>
                        <select
                            name="Module"
                            value={formData.Module}
                            onChange={handleInputChange}
                            className={`w-full p-2 border rounded ${validationErrors.Module ? "border-red-500" : "border-gray-300"}`}
                        >
                            <option value="">Select Module</option>
                            {modules.map(m => (
                                <option key={m.id} value={m.name}>{m.name}</option>
                            ))}
                        </select>

                        {validationErrors.Module && <ErrorMessage message={validationErrors.Module} />}
                    </div>
                </div>

                {/* Academic Year */}
                <div className="mb-4">
                    <label className="block mb-1">Academic Year *</label>
                    <select
                        name="academicYear"
                        value={formData.academicYear}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded ${validationErrors.academicYear ? "border-red-500" : "border-gray-300"}`}
                    >
                        <option value="">Select Year</option>
                        {academicYears.map(y => (
                            <option key={y.id} value={y.name}>{y.name}</option>
                        ))}
                    </select>
                    {validationErrors.academicYear && <ErrorMessage message={validationErrors.academicYear} />}
                </div>

                {/* Photo Upload */}
                <div className="mb-6 border-t pt-4">
                    <label className="block mb-1 font-semibold">Upload Past Question Paper *</label>
                    <div className="flex flex-col items-center w-full">
                        <div className="w-full max-w-2xl aspect-[2/3] border-4 border-dashed flex items-center justify-center mb-2 overflow-hidden">
                            {formData.userPhoto ? (
                                <img
                                    src={formData.userPhoto}
                                    alt="Past Question Paper"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                "Upload PDF/Image"
                            )}
                        </div>
                        <CloudinaryImageUploader onUploadSuccess={handleUploadSuccess} />
                        <button
                            onClick={() => setShowCamera(true)}
                            className="mt-2 px-4 py-2 bg-green-600 text-white rounded font-semibold transition hover:bg-green-700"
                        >
                            Use Camera
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || isUploading}
                    className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                    {isSubmitting ? "Submitting..." : formData.id ? "Update Student" : "Submit New Student Data"}
                </button>
            </div>

            {/* Table */}
            <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-4xl">
                <h2 className="text-xl font-bold text-indigo-700 mb-4">Past Question Records</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto border border-gray-300">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="px-4 py-2 border">Student ID</th>
                                <th className="px-4 py-2 border">Name</th>
                                <th className="px-4 py-2 border">Dept</th>
                                <th className="px-4 py-2 border">Level</th>
                                <th className="px-4 py-2 border">Module</th>
                                <th className="px-4 py-2 border">Year</th>
                                <th className="px-4 py-2 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((record) => (
                                <tr key={record.id} className="text-center">
                                    <td className="px-4 py-2 border">{record.studentID}</td>
                                    <td className="px-4 py-2 border">{record.studentName}</td>
                                    <td className="px-4 py-2 border">
                                        {Array.isArray(record.Courses) ? record.Courses.join(", ") : record.Courses}
                                    </td>

                                    <td className="px-4 py-2 border">{record.Level}</td>
                                    <td className="px-4 py-2 border">{record.Module}</td>
                                    <td className="px-4 py-2 border">{record.academicYear}</td>
                                    <td className="px-4 py-2 border space-x-2">
                                        <button
                                            onClick={() => handleEdit(record)}
                                            className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(record.id)}
                                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {records.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-4">No records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showCamera && (
                <CameraCapture
                    setPhoto={handleCameraCapture}
                    onClose={() => setShowCamera(false)}
                    initialFacingMode="user"
                />
            )}
        </div>
    );
};

export default AdminPage;