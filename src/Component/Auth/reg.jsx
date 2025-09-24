import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSwipeable } from "react-swipeable";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase";

const StudentPage = () => {
    const location = useLocation();
    const studentData = location.state?.user;

    const [pastQuestions, setPastQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalData, setModalData] = useState(null);

    const handlers = useSwipeable({
        onSwipedLeft: () => handleNext(),
        onSwipedRight: () => handlePrev(),
        preventDefaultTouchmoveEvent: true,
        trackMouse: true,
    });

    const currentIndex = modalData ? pastQuestions.findIndex(p => p.id === modalData.id) : -1;

    const handleNext = () => {
        const nextIndex = (currentIndex + 1) % pastQuestions.length;
        setModalData(pastQuestions[nextIndex]);
    };

    const handlePrev = () => {
        const prevIndex = (currentIndex - 1 + pastQuestions.length) % pastQuestions.length;
        setModalData(pastQuestions[prevIndex]);
    };

    useEffect(() => {
        if (!studentData?.course) {
            setIsLoading(false);
            return;
        }

        const q = query(
            collection(db, "PastQuestions"),
            where("course", "==", studentData.course)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const questions = [];
            querySnapshot.forEach((doc) => {
                questions.push({ id: doc.id, ...doc.data() });
            });
            setPastQuestions(questions);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching past questions: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [studentData]); // Dependency on studentData to refetch if it changes

    if (!studentData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
                <p>Please log in to view this page.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-indigo-600 text-white shadow-lg">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img
                            src={studentData.userPhotoUrl}
                            alt="Student"
                            className="w-14 h-14 rounded-full border-2 border-white shadow"
                        />
                        <div>
                            <h1 className="text-xl font-bold">{studentData.studentName}</h1>
                            <p className="text-sm opacity-90">{studentData.course}</p>
                        </div>
                    </div>
                    <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">
                        Logout
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-6xl mx-auto px-6 py-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">📚 Past Question Papers</h2>

                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <p className="text-gray-500">Loading questions...</p>
                    </div>
                ) : pastQuestions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pastQuestions.map((pq) => (
                            <div
                                key={pq.id}
                                className="bg-white shadow-md rounded-xl p-5 flex flex-col justify-between hover:shadow-xl transition"
                            >
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-indigo-700">{pq.module}</h3>
                                    <p className="text-sm text-gray-600">{pq.semester} • {pq.year}</p>
                                </div>

                                {/* Preview */}
                                <div
                                    className="mb-4 h-64 border rounded overflow-hidden flex items-center justify-center bg-gray-100 cursor-pointer"
                                    onClick={() => setModalData(pq)}
                                >
                                    <img
                                        src={pq.fileUrl}
                                        alt={pq.module}
                                        className="h-full object-contain"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-md p-8 text-center">
                        <p className="text-gray-500">No past questions found for your course at this time.</p>
                    </div>
                )}
            </main>

            {/* Modal */}
            {modalData && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
                    onClick={() => setModalData(null)}
                >
                    <div
                        {...handlers}
                        className="relative max-w-3xl w-full flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute top-2 right-2 text-white text-2xl font-bold"
                            onClick={() => setModalData(null)}
                        >
                            &times;
                        </button>

                        <img
                            src={modalData.fileUrl}
                            alt={modalData.module}
                            className="w-full h-auto max-h-[80vh] object-contain"
                        />

                        {/* Navigation below image */}
                        <div className="mt-4 flex items-center gap-4">
                            <button
                                className="bg-white text-indigo-700 px-4 py-2 rounded font-bold hover:bg-gray-200 transition"
                                onClick={handlePrev}
                            >
                                &#8592; Previous
                            </button>
                            <button
                                className="bg-white text-indigo-700 px-4 py-2 rounded font-bold hover:bg-gray-200 transition"
                                onClick={handleNext}
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
export default StudentPage;