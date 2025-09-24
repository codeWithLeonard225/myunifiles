import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSwipeable } from "react-swipeable";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase"; // Ensure this path to your Firestore config is correct

export default function StudentPage() {
    const location = useLocation();
    // Safely get student data
    const studentData = location.state?.user || {};

    // State for dynamically fetched questions and modal control
    const [pastQuestions, setPastQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalData, setModalData] = useState(null);

    // --- Firestore Fetch Logic ---
    useEffect(() => {
        // Only fetch if studentData has a course defined
        if (studentData.course) {
            setLoading(true);
            setError(null);

            // Create a query filtered by the logged-in student's course
            const q = query(
                collection(db, "PastQuestions"),
                where("course", "==", studentData.course)
            );

            // Set up a real-time listener for the past questions
            const unsubscribe = onSnapshot(q, (snapshot) => {
                // FIX: Include index and use it as a fallback for the ID
                const fetchedQuestions = snapshot.docs.map((doc, index) => ({
                    // Ensure 'id' is always unique
                    id: doc.id || `missing-id-${index}`,
                    
                    ...doc.data(),
                    // Map your Firestore fields to component properties
                    fileUrl: doc.data().userPhotoUrl, 
                    module: doc.data().Module || 'N/A', 
                    semester: doc.data().Semester || 'N/A',
                    year: doc.data().academicYear || 'N/A',
                    // Simple check to determine if it's an image or a PDF
                    type: doc.data().userPhotoUrl && doc.data().userPhotoUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image', 
                }));
                
                setPastQuestions(fetchedQuestions);
                setLoading(false);
            }, (err) => {
                console.error("Firestore fetch error:", err);
                setError("Failed to load past questions.");
                setLoading(false);
            });

            // Cleanup subscription on component unmount
            return () => unsubscribe();
        } else if (!studentData.course) {
            setLoading(false);
        }
    }, [studentData.course]); 
    // ----------------------------

    // Determine the index of the currently open question for navigation
    const currentIndex = modalData ? pastQuestions.findIndex(p => p.id === modalData.id) : -1;

    // Swipe handlers
    const handlers = useSwipeable({
        onSwipedLeft: () => handleNext(),
        onSwipedRight: () => handlePrev(),
        preventDefaultTouchmoveEvent: true,
        trackMouse: true,
    });

    const handleNext = () => {
        if (pastQuestions.length === 0) return;
        const nextIndex = (currentIndex + 1) % pastQuestions.length;
        setModalData(pastQuestions[nextIndex]);
    };

    const handlePrev = () => {
        if (pastQuestions.length === 0) return;
        const prevIndex = (currentIndex - 1 + pastQuestions.length) % pastQuestions.length;
        setModalData(pastQuestions[prevIndex]);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-indigo-600 text-white shadow-lg">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img
                            src={studentData.userPhotoUrl || "https://via.placeholder.com/150"}
                            alt="Student"
                            className="w-14 h-14 rounded-full border-2 border-white shadow object-cover"
                        />
                        <div>
                            <h1 className="text-xl font-bold">{studentData.studentName || 'Guest User'}</h1>
                            <p className="text-sm opacity-90">{studentData.course || 'Course Not Assigned'}</p>
                        </div>
                    </div>
                    <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">
                        Logout
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-6xl mx-auto px-6 py-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">📚 Past Question Papers for {studentData.course}</h2>

                {loading && (
                    <div className="text-center text-indigo-600 font-medium p-8">Loading questions...</div>
                )}
                
                {error && (
                    <div className="text-center text-red-600 font-medium p-8 border border-red-300 bg-red-50 rounded">{error}</div>
                )}

                {!loading && !error && pastQuestions.length === 0 && (
                     <div className="text-center text-gray-500 font-medium p-8 border border-gray-300 bg-white rounded">No past questions found for your course ({studentData.course}).</div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   {pastQuestions.map((pq) => (
                        <div
                            key={pq.id} // ✅ Uses the now-guaranteed unique ID
                            className="bg-white shadow-md rounded-xl p-5 flex flex-col justify-between hover:shadow-xl transition cursor-pointer"
                            onClick={() => setModalData(pq)}
                        >
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-indigo-700">{pq.module}</h3>
                                <p className="text-sm text-gray-600">{pq.semester} • {pq.year}</p>
                            </div>

                            {/* Preview: Handle image vs. potential PDF/other files */}
                            <div
                                className="mb-4 h-64 border rounded overflow-hidden flex items-center justify-center bg-gray-100"
                            >
                                {pq.type === 'image' ? (
                                    <img
                                        src={pq.fileUrl}
                                        alt={pq.module}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="text-center text-indigo-500 p-4">
                                        <svg className="w-10 h-10 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20"><path d="M5 2a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2H5zm7 10H8v1h4v-1zm0-3H8v1h4V9zm0-3H8v1h4V6z"></path></svg>
                                        <p className="text-xs font-semibold">Click to View PDF</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Modal - Portrait Display Enforced */}
            {modalData && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
                    onClick={() => setModalData(null)}
                >
                    <div
                        {...handlers} // attach swipe handlers here
                        className="relative max-w-5xl w-full flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            className="absolute top-2 right-2 md:-right-8 bg-white text-black w-8 h-8 rounded-full shadow-lg flex items-center justify-center text-xl font-bold z-10"
                            onClick={() => setModalData(null)}
                        >
                            &times;
                        </button>

                        {/* Document Display: Portrait box enforced by h-[80vh] and max-w-lg */}
                        <div 
                            className="w-full h-[80vh] max-w-lg lg:max-w-xl bg-white rounded-lg overflow-hidden shadow-2xl"
                        >
                            {modalData.type === 'image' ? (
                                <img
                                    src={modalData.fileUrl}
                                    alt={modalData.module}
                                    className="w-full h-full object-contain" 
                                />
                            ) : (
                                // For PDF documents, use an iframe to display them
                                <iframe
                                    src={modalData.fileUrl}
                                    title={modalData.module}
                                    className="w-full h-full border-none"
                                    frameBorder="0"
                                >
                                    This browser does not support PDFs. Please download the PDF to view it.
                                </iframe>
                            )}
                        </div>
                        

                        {/* Navigation below image */}
                        <div className="mt-4 flex items-center gap-4">
                            <button
                                className="bg-white text-indigo-700 px-4 py-2 rounded font-bold hover:bg-gray-200 transition disabled:opacity-50"
                                onClick={handlePrev}
                                disabled={pastQuestions.length <= 1}
                            >
                                &#8592; Previous
                            </button>
                            <div className="text-white font-medium text-sm">
                                {currentIndex + 1} of {pastQuestions.length}
                            </div>
                            <button
                                className="bg-white text-indigo-700 px-4 py-2 rounded font-bold hover:bg-gray-200 transition disabled:opacity-50"
                                onClick={handleNext}
                                disabled={pastQuestions.length <= 1}
                            >
                                Next &#8594;
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}