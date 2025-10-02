import React, { useState, useEffect } from "react";
import { db } from "../../../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot,orderBy,query  } from "firebase/firestore";
import { toast } from "react-toastify";

const DataFormsPage = () => {
  // Module State
  const [moduleData, setModuleData] = useState({ moduleName: "" });
  const [modules, setModules] = useState([]);
  const [editingModule, setEditingModule] = useState(null);

  // Course State
  const [courseData, setCourseData] = useState({ courseName: "" });
  const [courses, setCourses] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);

  // Institution State
  const [institutionData, setInstitutionData] = useState({ institutionName: "" });
  const [institutions, setInstitutions] = useState([]);
  const [editingInstitution, setEditingInstitution] = useState(null);

  // Academic Year State
  const [academicYearData, setAcademicYearData] = useState({ yearName: "" });
  const [academicYears, setAcademicYears] = useState([]);
  const [editingAcademicYear, setEditingAcademicYear] = useState(null);

  // Level State
  const [levelData, setLevelData] = useState({ levelName: "" });
  const [levels, setLevels] = useState([]);
  const [editingLevel, setEditingLevel] = useState(null);

  // --- Fetch Data ---
useEffect(() => {
  const unsubModules = fetchAll("Modules", setModules, "moduleName");
  const unsubCourses = fetchAll("Courses", setCourses, "courseName");
  const unsubInstitutions = fetchAll("Institutions", setInstitutions, "institutionName");
  const unsubAcademicYears = fetchAll("AcademicYears", setAcademicYears, "yearName");
  const unsubLevels = fetchAll("Levels", setLevels, "levelName");

  return () => {
    unsubModules();
    unsubCourses();
    unsubInstitutions();
    unsubAcademicYears();
    unsubLevels();
  };
}, []);



const fetchAll = (collectionName, setState, fieldName) => {
  const colRef = collection(db, collectionName);
  const q = query(colRef, orderBy(fieldName, "asc")); // ✅ alphabetic order

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setState(data);
    },
    (err) => {
      console.error(err);
      toast.error(`Failed to fetch ${collectionName}`);
    }
  );

  return unsubscribe;
};


  // --- Handlers ---
  const handleSubmit = async (data, setData, collectionName, editing, setEditing) => {
    if (!Object.values(data)[0]) return toast.error("Field is required!");
    try {
      if (editing) {
        const docRef = doc(db, collectionName, editing.id);
        await updateDoc(docRef, data);
        toast.success(`${collectionName.slice(0, -1)} updated!`);
        setEditing(null);
      } else {
        await addDoc(collection(db, collectionName), data);
        toast.success(`${collectionName.slice(0, -1)} added!`);
      }
      setData({ [Object.keys(data)[0]]: "" });
      fetchAll(
        collectionName,
        collectionName === "Modules"
          ? setModules
          : collectionName === "Courses"
            ? setCourses
            : collectionName === "Institutions"
              ? setInstitutions
              : collectionName === "AcademicYears"
                ? setAcademicYears
                : setLevels
      );
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${editing ? "update" : "add"} ${collectionName.slice(0, -1)}`);
    }
  };

  const handleEdit = (item, type) => {
    if (type === "module") {
      setModuleData({ moduleName: item.moduleName });
      setEditingModule(item);
    } else if (type === "course") {
      setCourseData({ courseName: item.courseName });
      setEditingCourse(item);
    } else if (type === "institution") {
      setInstitutionData({ institutionName: item.institutionName });
      setEditingInstitution(item);
    } else if (type === "academicYear") {
      setAcademicYearData({ yearName: item.yearName });
      setEditingAcademicYear(item);
    } else {
      setLevelData({ levelName: item.levelName });
      setEditingLevel(item);
    }
  };

  const handleDelete = async (id, collectionName, setState) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      toast.success(`${collectionName.slice(0, -1)} deleted!`);
      fetchAll(collectionName, setState);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to delete ${collectionName.slice(0, -1)}`);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-3xl font-bold text-center mb-6">Add Data Forms</h1>
      <div className="grid md:grid-cols-2 gap-6">

        {/* Institution Form */}
        <div className="bg-white p-6 rounded shadow-md flex flex-col">
          <h2 className="text-xl font-semibold mb-4">{editingInstitution ? "Edit Institution" : "Add Institution"}</h2>
          <input
            type="text"
            placeholder="Institution Name"
            value={institutionData.institutionName}
            onChange={(e) => setInstitutionData({ institutionName: e.target.value })}
            className="p-2 border rounded mb-3"
          />
          <button
            onClick={() => handleSubmit(institutionData, setInstitutionData, "Institutions", editingInstitution, setEditingInstitution)}
            className="bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
          >
            {editingInstitution ? "Update Institution" : "Add Institution"}
          </button>
          <div className="mt-4 w-full overflow-x-auto">
            <table className="mt-4 w-full text-left border">
              <thead>
                <tr>
                  <th className="border p-2">Institution Name</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map(i => (
                  <tr key={i.id}>
                    <td className="border p-2">{i.institutionName}</td>
                    <td className="border p-2 space-x-2">
                      <button onClick={() => handleEdit(i, "institution")} className="bg-yellow-500 px-2 py-1 rounded">Edit</button>
                      <button onClick={() => handleDelete(i.id, "Institutions", setInstitutions)} className="bg-red-500 px-2 py-1 rounded">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>

        </div>

        {/* Level Form */}
        <div className="bg-white p-6 rounded shadow-md flex flex-col">
          <h2 className="text-xl font-semibold mb-4">{editingLevel ? "Edit Level" : "Add Level"}</h2>
          <input
            type="text"
            placeholder="Level (e.g., Year 1, 200 Level)"
            value={levelData.levelName}
            onChange={(e) => setLevelData({ levelName: e.target.value })}
            className="p-2 border rounded mb-3"
          />
          <button
            onClick={() => handleSubmit(levelData, setLevelData, "Levels", editingLevel, setEditingLevel)}
            className="bg-teal-600 text-white py-2 rounded hover:bg-teal-700 transition"
          >
            {editingLevel ? "Update Level" : "Add Level"}
          </button>

          <table className="mt-4 w-full text-left border">
            <thead>
              <tr>
                <th className="border p-2">Level</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {levels.map(l => (
                <tr key={l.id}>
                  <td className="border p-2">{l.levelName}</td>
                  <td className="border p-2 space-x-2">
                    <button onClick={() => handleEdit(l, "level")} className="bg-yellow-500 px-2 py-1 rounded">Edit</button>
                    <button onClick={() => handleDelete(l.id, "Levels", setLevels)} className="bg-red-500 px-2 py-1 rounded">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Course Form */}
        <div className="bg-white p-6 rounded shadow-md flex flex-col">
          <h2 className="text-xl font-semibold mb-4">{editingCourse ? "Edit Course" : "Add Course"}</h2>
          <input
            type="text"
            placeholder="Course Name"
            value={courseData.courseName}
            onChange={(e) => setCourseData({ courseName: e.target.value })}
            className="p-2 border rounded mb-3"
          />
          <button
            onClick={() => handleSubmit(courseData, setCourseData, "Courses", editingCourse, setEditingCourse)}
            className="bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
          >
            {editingCourse ? "Update Course" : "Add Course"}
          </button>

          <table className="mt-4 w-full text-left border">
            <thead>
              <tr>
                <th className="border p-2">Course Name</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(c => (
                <tr key={c.id}>
                  <td className="border p-2">{c.courseName}</td>
                  <td className="border p-2 space-x-2">
                    <button onClick={() => handleEdit(c, "course")} className="bg-yellow-500 px-2 py-1 rounded">Edit</button>
                    <button onClick={() => handleDelete(c.id, "Courses", setCourses)} className="bg-red-500 px-2 py-1 rounded">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Module Form */}
        <div className="bg-white p-6 rounded shadow-md flex flex-col">
          <h2 className="text-xl font-semibold mb-4">{editingModule ? "Edit Module" : "Add Module"}</h2>
          <input
            type="text"
            placeholder="Module Name"
            value={moduleData.moduleName}
            onChange={(e) => setModuleData({ moduleName: e.target.value })}
            className="p-2 border rounded mb-3"
          />
          <button
            onClick={() => handleSubmit(moduleData, setModuleData, "Modules", editingModule, setEditingModule)}
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            {editingModule ? "Update Module" : "Add Module"}
          </button>
          <div className="mt-4 w-full overflow-y-auto max-h-64 border">
            <table className="w-full text-left border">
              <thead className="sticky top-0 bg-gray-100">
                <tr>
                  <th className="border p-2">Module Name</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => (
                  <tr key={m.id}>
                    <td className="border p-2">{m.moduleName}</td>
                    <td className="border p-2 space-x-2 flex flex-wrap">
                      <button
                        onClick={() => handleEdit(m, "module")}
                        className="bg-yellow-500 px-2 py-1 rounded text-xs sm:text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(m.id, "Modules", setModules)}
                        className="bg-red-500 px-2 py-1 rounded text-xs sm:text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Academic Year Form */}
        <div className="bg-white p-6 rounded shadow-md flex flex-col">
          <h2 className="text-xl font-semibold mb-4">{editingAcademicYear ? "Edit Academic Year" : "Add Academic Year"}</h2>
          <input
            type="text"
            placeholder="Academic Year (e.g., 2024/2025)"
            value={academicYearData.yearName}
            onChange={(e) => setAcademicYearData({ yearName: e.target.value })}
            className="p-2 border rounded mb-3"
          />
          <button
            onClick={() => handleSubmit(academicYearData, setAcademicYearData, "AcademicYears", editingAcademicYear, setEditingAcademicYear)}
            className="bg-orange-600 text-white py-2 rounded hover:bg-orange-700 transition"
          >
            {editingAcademicYear ? "Update Academic Year" : "Add Academic Year"}
          </button>

          <table className="mt-4 w-full text-left border">
            <thead>
              <tr>
                <th className="border p-2">Academic Year</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {academicYears.map(y => (
                <tr key={y.id}>
                  <td className="border p-2">{y.yearName}</td>
                  <td className="border p-2 space-x-2">
                    <button onClick={() => handleEdit(y, "academicYear")} className="bg-yellow-500 px-2 py-1 rounded">Edit</button>
                    <button onClick={() => handleDelete(y.id, "AcademicYears", setAcademicYears)} className="bg-red-500 px-2 py-1 rounded">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default DataFormsPage;
