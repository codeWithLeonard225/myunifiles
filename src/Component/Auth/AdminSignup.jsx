// src/pages/AdminSignup.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { db } from "../../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import CameraCapture from "../CaptureCamera/CameraCapture";
import CloudinaryImageUploader from "../CaptureCamera/CloudinaryImageUploader";

// --- Constants ---
const COLLECTION_NAME = "AdminUser";
const generateUniqueId = () => uuidv4().slice(0, 8);

const LEVELS = ["Certificate", "Diploma", "Degree", "Postgraduate Diploma", "Masters"];
const ACADEMIC_YEARS = ["First Year", "Second Year", "Third Year", "Fourth Year"];

// --- Validation helper ---
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

const AdminSignup = () => {
  const [formData, setFormData] = useState({
    studentID: generateUniqueId(),
    studentName: "",
    course: "",
    Level: "",
    academicYear: "",
    registrationDate: new Date().toISOString().slice(0, 10),
    registeredBy: "Admin",
    userPhoto: null,
    userPublicId: null,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [courses, setCourses] = useState([]);
  const [records, setRecords] = useState([]); // store fetched records
  const [levels, setLevels] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [editId, setEditId] = useState(null);


  // 🔽 Fetch Levels & Academic Years dynamically
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {

        const coursesSnap = await getDocs(collection(db, "Courses"));
        const levelsSnap = await getDocs(collection(db, "Levels"));
        const yearsSnap = await getDocs(collection(db, "AcademicYears"));



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

  // Realtime fetch for AdminUser records
  useEffect(() => {
    const q = query(collection(db, COLLECTION_NAME), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecords(data);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
    const fields = ["studentName", "course", "Level", "academicYear"];
    const errors = {};
    let valid = true;

    fields.forEach((field) => {
      const value = formData[field];
      const error = validateField(field, value);
      if (error) {
        errors[field] = error;
        valid = false;
      }
    });

    if (!formData.userPhoto) {
      toast.error("Photo is required!");
      valid = false;
    }

    setValidationErrors(errors);
    return valid;
  };

  const resetForm = () => {
    setFormData({
      studentID: generateUniqueId(),
      studentName: "",
      course: "",
      Level: "",
      academicYear: "",
      registrationDate: new Date().toISOString().slice(0, 10),
      registeredBy: "Admin",
      userPhoto: null,
      userPublicId: null,
    });
    setValidationErrors({});
     setEditId(null); // <-- reset edit mode
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const dataToSave = {
        ...formData,
        studentName: formData.studentName.toLowerCase(),
        userPhotoUrl: formData.userPhoto,
      };
      delete dataToSave.userPhoto;

      if (editId) {
        // 🔹 Update existing record
        const ref = doc(db, COLLECTION_NAME, editId);
        await updateDoc(ref, dataToSave);
        toast.success("Record updated successfully!");
      } else {
        // 🔹 Add new record
        await addDoc(collection(db, COLLECTION_NAME), {
          ...dataToSave,
          timestamp: new Date(),
        });
        toast.success("Basic Signup Data Saved! 🎉");
      }

      resetForm();
      setEditId(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit form. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (record) => {
    setFormData({
      studentID: record.studentID || generateUniqueId(),
      studentName: record.studentName || "",
      course: record.course || "",
      Level: record.Level || "",
      academicYear: record.academicYear || "",
      registrationDate: record.registrationDate || new Date().toISOString().slice(0, 10),
      registeredBy: record.registeredBy || "Admin",
      userPhoto: record.userPhotoUrl || null,
      userPublicId: record.userPublicId || null,
    });
    setEditId(record.id);
    toast.info("Editing record...");
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
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-center mb-6 text-green-700">
          Admin Basic Signup Form
        </h2>

        {/* Student ID & Name */}
        <div className="flex flex-col md:flex-row md:space-x-4 mb-4">
          <div className="flex-1 mb-4 md:mb-0">
            <label className="block mb-1 font-medium text-gray-700">Student ID</label>
            <input
              type="text"
              name="studentID"
              value={formData.studentID}
              onChange={handleInputChange}
              className="w-full p-2 border rounded border-gray-300 bg-gray-50 font-mono text-sm"
              disabled // Keep the auto-generated ID visible but uneditable
            />
            <p className="text-xs text-gray-500 mt-1">Auto-generated unique ID.</p>
          </div>
          <div className="flex-1">
            <label className="block mb-1 font-medium text-gray-700">Student Name *</label>
            <input
              type="text"
              name="studentName"
              value={formData.studentName}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded ${validationErrors.studentName ? "border-red-500" : "border-gray-300"}`}
              placeholder="e.g., Jane Doe"
            />
            {validationErrors.studentName && (
              <ErrorMessage message={validationErrors.studentName} />
            )}
          </div>
        </div>

        {/* Course + Level */}
        <div className="flex flex-col md:flex-row md:space-x-4 mb-4">
          <div className="flex-1 mb-4 md:mb-0">
            <label className="block mb-1 font-medium text-gray-700">Course *</label>
            <select
              name="course"
              value={formData.course}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded ${validationErrors.course ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="">Select Course</option>
              {courses.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            {validationErrors.course && (
              <ErrorMessage message={validationErrors.course} />
            )}
          </div>
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
          <label className="block mb-1 font-semibold text-gray-700">Upload Student Photo *</label>
          <div className="flex flex-col items-center w-full">
            <div className="w-36 h-48 border-4 border-dashed flex items-center justify-center mb-2 overflow-hidden bg-gray-50">
              {formData.userPhoto ? (
                <img
                  src={formData.userPhoto}
                  alt="Student Photo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-gray-500 text-sm">Upload Photo</span>
              )}
            </div>
            <CloudinaryImageUploader onUploadSuccess={handleUploadSuccess} />
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded font-semibold transition hover:bg-indigo-700"
            >
              Use Camera
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex space-x-2">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
            className="flex-1 bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 disabled:bg-gray-400 transition"
          >
            {isSubmitting ? "Saving Data..." : editId ? "Update Record" : "Submit Basic Signup Data"}
          </button>

          {editId && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setEditId(null);
                toast.info("Edit cancelled");
              }}
              className="flex-1 bg-gray-500 text-white py-2 rounded font-semibold hover:bg-gray-600 transition"
            >
              Cancel Edit
            </button>
          )}
        </div>


      </div>

      {/* Records Table */}
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-5xl">
        <h2 className="text-xl font-bold text-green-700 mb-4">Registered Admin Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-3 py-2 border">Student ID</th>
                <th className="px-3 py-2 border">Name</th>
                <th className="px-3 py-2 border">Course</th>
                <th className="px-3 py-2 border">Level</th>
                <th className="px-3 py-2 border">Year</th>
                <th className="px-3 py-2 border">Photo</th>
                <th className="px-3 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="text-center">
                  <td className="px-3 py-2 border">{record.studentID}</td>
                  <td className="px-3 py-2 border">{record.studentName}</td>
                  <td className="px-3 py-2 border">{record.course}</td>
                  <td className="px-3 py-2 border">{record.Level}</td>
                  <td className="px-3 py-2 border">{record.academicYear}</td>
                  <td className="px-3 py-2 border">
                    {record.userPhotoUrl ? (
                      <img
                        src={record.userPhotoUrl}
                        alt="student"
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="px-3 py-2 border space-x-2">

                    <td className="px-3 py-2 border space-x-2">
                      <button
                        onClick={() => handleEdit(record)}
                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
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

                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center">
                    No records found.
                  </td>
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

export default AdminSignup;