import React, { useState,useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { db } from "../../../firebase";
import { Link } from "react-router-dom";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDocs,
} from "firebase/firestore";

import { v4 as uuidv4 } from "uuid";

// Components assumed to exist
import CameraCapture from "../CaptureCamera/CameraCapture";
import CloudinaryImageUploader from "../CaptureCamera/CloudinaryImageUploader";

// --- Constants ---
const COLLECTION_NAME = "Registration";
const generateUniqueId = () => uuidv4().slice(0, 8);

// --- Helper Functions ---
const calculateAge = (dobString) => {
    if (!dobString) return "";
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age > 0 ? age.toString() : "";
};

const validateField = (name, value) => {
    switch (name) {
        case "studentName":
            if (!value || value.trim().length < 3) return "Student name must be at least 3 characters."; break;
        case "tele":
            if (!/^\d{8,15}$/.test(value)) return "Phone number must be 8-15 digits."; break;
        case "dob":
            if (!value) return "Date of Birth is required.";
            if (parseInt(calculateAge(value)) < 16) return "Student must be at least 16 years old."; break;
        case "institution":
            if (!value || value.trim().length < 3) return "Institution name is required."; break;
        case "address":
            if (!value || value.trim().length < 10) return "Address must be at least 10 characters."; break;
        case "course":
            if (!value) return "Course selection is required."; break;
        case "academicYear":
            if (!value) return "Academic Year selection is required."; break;
        default: return "";
    }
    return "";
};

// --- Presentation Components ---
const ErrorMessage = ({ message }) => (
    <p className="text-red-500 text-xs mt-1 font-medium">{message}</p>
);

const stepVariants = {
    enter: (direction) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.5 } },
    exit: (direction) => ({ x: direction < 0 ? 1000 : -1000, opacity: 0, transition: { duration: 0.5 } }),
};

// =========================================================================
//                             ID CARD PREVIEW COMPONENT
// =========================================================================

const IDCardPreview = ({ data, onClose }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (!data) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white shadow-2xl p-6 rounded-2xl w-full max-w-sm text-center"
            >
                <h3 className="text-2xl font-bold mb-4 text-green-600">Registration Complete! 🎉</h3>
                <h4 className="text-xl font-semibold mb-6 text-gray-700">Student ID Card</h4>

                <div className="flex flex-col items-center border border-gray-200 p-4 rounded-lg bg-indigo-50">
                    <div className="w-32 h-40 mb-4 border-2 border-indigo-600 rounded overflow-hidden shadow-md">
                        {data.userPhoto ? (
                            <img src={data.userPhoto} alt="Student" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-gray-400 p-4 block text-xs">No Photo</span>
                        )}
                    </div>

                    <p className="text-lg font-bold text-gray-800 break-words">{data.studentName}</p>
                    <p className="text-sm text-gray-500">ID: <span className="font-mono text-indigo-700">{data.studentID}</span></p>
                    <div className="text-left w-full mt-3 text-sm space-y-1">
                        <p>📞 Tel: {data.tele}</p>
                        <p>🎓 Course: {data.course} ({data.academicYear})</p>
                        <p>🏫 Institution: {data.institution}</p>
                        <p>📅 Reg Date: {formatDate(data.registrationDate)}</p>
                    </div>
                </div>

                <Link
                    to="/"
                    className="mt-6 w-full inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                    Go to Home
                </Link>
            </motion.div>
        </div>
    );
};

// =========================================================================
//                             MAIN REGISTRATION COMPONENT
// =========================================================================

const Registration = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [formData, setFormData] = useState({
        studentID: generateUniqueId(),
        studentName: "",
        tele: "",
        dob: "",
        age: "",
        institution: "",
        address: "",
        course: "",
        academicYear: "",
        registrationDate: new Date().toISOString().slice(0, 10),
        registeredBy: "Admin",
        userPhoto: null,
        userPublicId: null,
    });
    const [validationErrors, setValidationErrors] = useState({});
    const [showCamera, setShowCamera] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [institutions, setInstitutions] = useState([]);
    const [courses, setCourses] = useState([]);


    // Preview state
    const [showPreview, setShowPreview] = useState(false);
    const [submittedData, setSubmittedData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const instSnap = await getDocs(collection(db, "Institutions"));
                const courseSnap = await getDocs(collection(db, "Courses"));

                setInstitutions(instSnap.docs.map(doc => ({ id: doc.id, name: doc.data().institutionName })));
                setCourses(courseSnap.docs.map(doc => ({ id: doc.id, name: doc.data().courseName })));
            } catch (err) {
                console.error(err);
                toast.error("Failed to fetch institutions or courses");
            }
        };

        fetchData();
    }, []);

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        const newData = { ...formData, [name]: value };
        if (name === "dob") newData.age = calculateAge(value);
        setFormData(newData);
        setValidationErrors({ ...validationErrors, [name]: validateField(name, value) });
    };

    // Handle Cloudinary success (Placeholder for full Cloudinary logic)
    const handleUploadSuccess = (url, publicId) => {
        setFormData({ ...formData, userPhoto: url, userPublicId: publicId });
        setIsUploading(false);
        toast.success("Image uploaded successfully!");
    };

    // Handle Camera capture
    const handleCameraCapture = (url) => {
        setFormData({ ...formData, userPhoto: url });
        setShowCamera(false);
        toast.success("Photo captured successfully!");
    };

    // Step validation
    const validateStep = (step) => {
        let fields = [];
        if (step === 1) fields = ["studentName", "tele", "dob", "institution", "address"];
        if (step === 2) fields = ["course", "academicYear"];

        // This validation check is now redundant since the submit button is in Step 3
        // but it's good practice to keep the error message logic clean.
        if (step === 3 && !formData.userPhoto) {
            toast.error("Please upload a student photo before submitting.");
            return false;
        }

        const stepErrors = {};
        let valid = true;
        fields.forEach((field) => {
            const error = validateField(field, formData[field]);
            if (error) {
                stepErrors[field] = error;
                valid = false;
            }
        });
        setValidationErrors({ ...validationErrors, ...stepErrors });
        if (!valid) toast.error(`Please fix the errors in Step ${step}`);
        return valid;
    };

    const handleNext = () => {
        if (!validateStep(currentStep)) return;
        setDirection(1);
        setCurrentStep((prev) => Math.min(prev + 1, 3));
    };

    const handleBack = () => {
        setDirection(-1);
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    // Submit form: Final action that saves data and triggers the preview
    const handleSubmit = async () => {
        if (!validateStep(3)) return;
        setIsSubmitting(true);

        try {
            const dataToSave = {
                ...formData,
                 studentName: formData.studentName.toLowerCase(), // <-- lowercase here
                userPhotoUrl: formData.userPhoto,
            };

            // Clean up temporary keys before saving
            delete dataToSave.userPhoto;
            delete dataToSave.id;

            let finalID = formData.studentID;

            if (formData.id) {
                // UPDATE EXISTING STUDENT
                const docRef = doc(db, COLLECTION_NAME, formData.id);
                await updateDoc(docRef, dataToSave);
                toast.success("Student updated successfully! 🎉");
            } else {
                // REGISTER NEW STUDENT
                // Note: Firestore auto-generates a document ID. studentID is for display.
                const newDocRef = await addDoc(collection(db, COLLECTION_NAME), {
                    ...dataToSave,
                    studentID: finalID,
                    timestamp: new Date(),
                });
                toast.success("Student registered successfully! 🎉");
            }

            // --- Show Preview & Reset Form ---
            // Set the complete data (including studentID which might have been regenerated) for the preview
            setSubmittedData({ ...formData, userPhoto: formData.userPhoto, studentID: finalID });
            setShowPreview(true);

            // Reset form for next entry
            setFormData({
                studentID: generateUniqueId(),
                studentName: "", tele: "", dob: "", age: "", institution: "", address: "",
                course: "", academicYear: "",
                registrationDate: new Date().toISOString().slice(0, 10),
                registeredBy: "Admin", userPhoto: null, userPublicId: null,
            });
            setCurrentStep(1);
            setDirection(-1);

        } catch (err) {
            console.error(err);
            toast.error("Failed to submit form. Try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <motion.div key="step1" variants={stepVariants} initial="enter" animate="center" exit="exit" custom={direction}>
                        <div className="flex flex-col md:flex-row md:space-x-4">
                            <div className="flex-1">
                                <label className="block mb-1">Student ID</label>
                                <input type="text" value={formData.studentID} disabled className="w-full p-2 border rounded bg-gray-100" />
                            </div>
                            <div className="flex-1">
                                <label className="block mb-1">Student Name *</label>
                                <input type="text" name="studentName" value={formData.studentName} onChange={handleInputChange} className={`w-full p-2 border rounded ${validationErrors.studentName ? "border-red-500" : "border-gray-300"}`} />
                                {validationErrors.studentName && <ErrorMessage message={validationErrors.studentName} />}
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row md:space-x-4 mt-4">
                            <div className="flex-1">
                                <label className="block mb-1">Telephone *</label>
                                <input type="tel" name="tele" value={formData.tele} onChange={handleInputChange} className={`w-full p-2 border rounded ${validationErrors.tele ? "border-red-500" : "border-gray-300"}`} />
                                {validationErrors.tele && <ErrorMessage message={validationErrors.tele} />}
                            </div>
                            <div className="flex-1">
                                <label className="block mb-1">Date of Birth *</label>
                                <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className={`w-full p-2 border rounded ${validationErrors.dob ? "border-red-500" : "border-gray-300"}`} />
                                {validationErrors.dob && <ErrorMessage message={validationErrors.dob} />}
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block mb-1">Institution *</label>
                            <select
                                name="institution"
                                value={formData.institution}
                                onChange={handleInputChange}
                                className={`w-full p-2 border rounded ${validationErrors.institution ? "border-red-500" : "border-gray-300"}`}
                            >
                                <option value="">Select Institution</option>
                                {institutions.map(inst => (
                                    <option key={inst.id} value={inst.name}>{inst.name}</option>
                                ))}
                            </select>

                            {validationErrors.institution && <ErrorMessage message={validationErrors.institution} />}
                        </div>

                        <div className="mt-4">
                            <label className="block mb-1">Address *</label>
                            <textarea name="address" value={formData.address} onChange={handleInputChange} className={`w-full p-2 border rounded ${validationErrors.address ? "border-red-500" : "border-gray-300"}`} />
                            {validationErrors.address && <ErrorMessage message={validationErrors.address} />}
                        </div>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div key="step2" variants={stepVariants} initial="enter" animate="center" exit="exit" custom={direction}>
                        <div className="flex flex-col md:flex-row md:space-x-4">
                            <div className="flex-1">
                                <label className="block mb-1">Course *</label>
                                <select
                                    name="course"
                                    value={formData.course}
                                    onChange={handleInputChange}
                                    className={`w-full p-2 border rounded ${validationErrors.course ? "border-red-500" : "border-gray-300"}`}
                                >
                                    <option value="">Select Course</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.name}>{course.name}</option>
                                    ))}
                                </select>

                                {validationErrors.course && <ErrorMessage message={validationErrors.course} />}
                            </div>
                            <div className="flex-1">
                                <label className="block mb-1">Academic Year *</label>
                                <select name="academicYear" value={formData.academicYear} onChange={handleInputChange} className="w-full p-2 border rounded">
                                    <option value="">Select Year</option>
                                    <option value="First Year">First Year</option>
                                    <option value="Second Year">Second Year</option>
                                    <option value="Third Year">Third Year</option>
                                    <option value="Fourth Year">Fourth Year</option>
                                </select>
                                {validationErrors.academicYear && <ErrorMessage message={validationErrors.academicYear} />}
                            </div>
                        </div>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div key="step3" variants={stepVariants} initial="enter" animate="center" exit="exit" custom={direction}>
                        <h3 className="text-lg font-semibold mb-4 text-center">Upload Photo & Finalize</h3>
                        <div className="flex flex-col items-center">
                            <div className="w-36 h-48 border-4 border-dashed flex items-center justify-center mb-2">
                                {formData.userPhoto ? <img src={formData.userPhoto} alt="Student" className="w-full h-full object-cover" /> : "2-inch Photo"}
                            </div>
                            {/* NOTE: You need to pass setUploadProgress/setIsUploading to CloudinaryImageUploader */}
                            <CloudinaryImageUploader onUploadSuccess={handleUploadSuccess} />
                            <button onClick={() => setShowCamera(true)} className="mt-2 px-4 py-2 bg-green-600 text-white rounded font-semibold transition hover:bg-green-700">Use Camera</button>
                            {isUploading && (
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                            )}
                            {!formData.userPhoto && currentStep === 3 && <ErrorMessage message="Photo is required for registration." />}
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || isUploading || !formData.userPhoto}
                            className="mt-6 w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
                        >
                            {isSubmitting ? "Submitting..." : formData.id ? "Update Student" : "Submit Registration"}
                        </button>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
            <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-2xl">
                <h2 className="text-2xl font-bold text-center mb-6 text-indigo-700">
                    {formData.id ? "Update Student" : `Registration Step ${currentStep} of 3`}
                </h2>

                <div className="relative overflow-hidden min-h-96">
                    <AnimatePresence initial={false} custom={direction}>
                        {renderStep()}
                    </AnimatePresence>
                </div>

                <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
                    <button onClick={handleBack} disabled={currentStep === 1 || isSubmitting || isUploading} className="px-6 py-2 rounded bg-gray-200 text-gray-500 font-semibold transition">
                        ← Back
                    </button>
                    {currentStep < 3 && (
                        <button onClick={handleNext} disabled={isSubmitting || isUploading} className="px-6 py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition">
                            Next Step →
                        </button>
                    )}
                </div>
            </div>

            {showCamera && <CameraCapture setPhoto={handleCameraCapture} onClose={() => setShowCamera(false)} initialFacingMode="user" />}

            {/* Render ID Card Preview as a modal after submission */}
            <AnimatePresence>
                {showPreview && submittedData && (
                    <IDCardPreview data={submittedData} onClose={() => setShowPreview(false)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Registration;