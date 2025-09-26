import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSwipeable } from "react-swipeable";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../../../firebase"; // Ensure this path to your Firestore config is correct
import { toast } from "react-toastify";


export default function StudentPage() {
    const location = useLocation();
    // Safely get student data
    const studentData = location.state?.user || {};

    // State for dynamically fetched questions and modal control
    const [pastQuestions, setPastQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalData, setModalData] = useState(null);
    const [modules, setModules] = useState([]);
    const [levels, setLevels] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);

    const [modalPageIndex, setModalPageIndex] = useState(0); // Track current page within modal

    // Update modal opening function
    const openModal = (pq) => {
        setModalData(pq);
        setModalPageIndex(0); // default to first page
    };

    // Navigation functions
    const handleNextPage = () => {
        if (!modalData?.pages?.length) return;
        setModalPageIndex((prev) => (prev + 1) % modalData.pages.length);
    };

    const handlePrevPage = () => {
        if (!modalData?.pages?.length) return;
        setModalPageIndex((prev) => (prev - 1 + modalData.pages.length) % modalData.pages.length);
    };

    const [filters, setFilters] = useState({
        Level: '',
        Module: '',
        Year: '',
    });


  useEffect(() => {
    // Set up real-time listeners for all dropdowns
    const modulesRef = collection(db, "Modules");
    const levelsRef = collection(db, "Levels");
    const yearsRef = collection(db, "AcademicYears");

    const unsubscribeModules = onSnapshot(modulesRef, (snapshot) => {
        setModules(snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().moduleName,
        })));
    }, (err) => {
        console.error("Failed to load modules:", err);
        toast.error("Failed to load modules");
    });

    const unsubscribeLevels = onSnapshot(levelsRef, (snapshot) => {
        setLevels(snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().levelName,
        })));
    }, (err) => {
        console.error("Failed to load levels:", err);
        toast.error("Failed to load levels");
    });

    const unsubscribeYears = onSnapshot(yearsRef, (snapshot) => {
        setAcademicYears(snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().yearName,
        })));
    }, (err) => {
        console.error("Failed to load academic years:", err);
        toast.error("Failed to load academic years");
    });

    // Cleanup listeners on unmount
    return () => {
        unsubscribeModules();
        unsubscribeLevels();
        unsubscribeYears();
    };
}, []);

    const fetchFilteredQuestions = async () => {
        if (!studentData.course) return;

        setLoading(true);
        setError(null);

        try {
            let q = collection(db, "PastQuestions"); // Start with the collection

            // Build filters dynamically
            const conditions = [
                filters.Level && where("Level", "==", filters.Level),
                filters.Module && where("Module", "==", filters.Module),
                filters.Year && where("academicYear", "==", filters.Year),
                studentData.course && where("Courses", "array-contains", studentData.course)
            ].filter(Boolean); // remove nulls

            if (conditions.length > 0) {
                q = query(collection(db, "PastQuestions"), ...conditions);
            }

            const snapshot = await getDocs(q);

            const filteredQuestions = snapshot.docs.map((doc, index) => ({
                id: doc.id || `missing-id-${index}`,
                ...doc.data(),
                fileUrl: doc.data().userPhotoUrl,
                module: doc.data().Module || "N/A",
                Level: doc.data().Level || "N/A",
                semester: doc.data().Semester || "N/A",
                year: doc.data().academicYear || "N/A",
                type: doc.data().userPhotoUrl && doc.data().userPhotoUrl.toLowerCase().endsWith(".pdf") ? "pdf" : "image",
            }));

            setPastQuestions(filteredQuestions);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch filtered questions.");
            setLoading(false);
        }
    };


    // --- Firestore Fetch Logic ---
    useEffect(() => {
        // Only fetch if studentData has a course defined
        if (studentData.course) {
            setLoading(true);
            setError(null);

            // Create a query filtered by the logged-in student's course
            const q = query(
                collection(db, "PastQuestions"),
                where("Courses", "array-contains", studentData.course)
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
                    Level: doc.data().Level || 'N/A',
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
                        Personal
                    </button>
                </div>
            </header>
            <div className="mb-6 flex flex-wrap gap-4">
                <select
                    className="border p-2 rounded"
                    value={filters.Level}
                    onChange={(e) => setFilters({ ...filters, Level: e.target.value })}
                >
                    <option value="">All Levels</option>
                    {levels.map(lv => (
                        <option key={lv.id} value={lv.name}>{lv.name}</option>
                    ))}
                </select>

                <select
                    className="border p-2 rounded max-w-xs truncate"
                    value={filters.Module}
                    onChange={(e) => setFilters({ ...filters, Module: e.target.value })}
                >
                    <option value="">All Modules</option>
                    {modules.map(mod => (
                        <option key={mod.id} value={mod.name}>{mod.name}</option>
                    ))}
                </select>


                <select
                    className="border p-2 rounded"
                    value={filters.Year}
                    onChange={(e) => setFilters({ ...filters, Year: e.target.value })}
                >
                    <option value="">All Years</option>
                    {academicYears.map(y => (
                        <option key={y.id} value={y.name}>{y.name}</option>
                    ))}
                </select>

                <button
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    onClick={() => fetchFilteredQuestions()}
                >
                    Search
                </button>
            </div>



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
                            key={pq.id}
                            className="bg-white shadow-md rounded-xl p-5 flex flex-col justify-between hover:shadow-xl transition cursor-pointer"
                            onClick={() => openModal(pq)}
                        >
                            <div className="mb-4 flex justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-indigo-700">{pq.module}</h3>
                                    <p className="text-sm text-gray-600">{pq.semester} • {pq.year}</p>
                                </div>
                                <p className="text-sm text-gray-600">{pq.Level}</p>
                            </div>

                            {/* Preview Page 1 */}
                            <div className="mb-4 h-64 border rounded overflow-hidden flex items-center justify-center bg-gray-100">
                                {pq.pages && pq.pages.length > 0 ? (
                                    <img
                                        src={pq.pages[0].url} // Page 1 preview
                                        alt={`${pq.module} Page 1`}
                                        className="h-full w-full object-cover select-none pointer-events-none"
                                        draggable={false}
                                        onContextMenu={(e) => e.preventDefault()} // disable right-click / long-press
                                        onMouseDown={(e) => e.preventDefault()}   // prevent desktop press menu
                                        onTouchStart={(e) => e.preventDefault()}  // prevent mobile long-press
                                    />

                                ) : (
                                    <p className="text-gray-400">No pages uploaded</p>
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
                    <div {...handlers} className="relative max-w-5xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="absolute top-2 right-2 md:-right-8 bg-white text-black w-8 h-8 rounded-full shadow-lg flex items-center justify-center text-xl font-bold z-10"
                            onClick={() => setModalData(null)}
                        >
                            &times;
                        </button>

                        <div className="w-full h-full  max-w-lg lg:max-w-xl bg-white rounded-lg overflow-hidden shadow-2xl flex items-center justify-center">
                            {modalData.pages && modalData.pages.length > 0 ? (
                                <img
                                    src={modalData.pages[modalPageIndex].url}
                                    alt={`${modalData.module} Page ${modalPageIndex + 1}`}
                                    className="w-full h-full object-contain select-none pointer-events-none"
                                    draggable={false}
                                    onContextMenu={(e) => e.preventDefault()} // disable right-click
                                    onMouseDown={(e) => e.preventDefault()}   // prevent long-press menu on some devices
                                    onTouchStart={(e) => e.preventDefault()}  // stop mobile long-press menu
                                />

                            ) : (
                                <p className="text-center text-gray-500 p-4">No pages available</p>
                            )}
                        </div>

                        {/* Navigation */}
                        {modalData.pages && modalData.pages.length > 1 && (
                            <div className="mt-4 flex items-center gap-4">
                                <button
                                    className="bg-white text-indigo-700 px-4 py-2 rounded font-bold hover:bg-gray-200"
                                    onClick={handlePrevPage}
                                >
                                    &#8592; Previous
                                </button>
                                <div className="text-white font-medium text-sm">
                                    Page {modalPageIndex + 1} of {modalData.pages.length}
                                </div>
                                <button
                                    className="bg-white text-indigo-700 px-4 py-2 rounded font-bold hover:bg-gray-200"
                                    onClick={handleNextPage}
                                >
                                    Next &#8594;
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}