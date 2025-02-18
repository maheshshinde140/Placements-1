import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode"; // Fix incorrect import
import Header from "../Components/Header";
import { useNavigate } from "react-router-dom";
import { createStudent, listUsersOfCollege } from "../../redux/userSlice";
import { BsPersonFillAdd } from "react-icons/bs";
import Loading from "../../component/Loading";
import { AiFillDashboard } from "react-icons/ai";
import CreateStudentPopup from "../Components/CreateStudentPopup";
import StatusSidebar from "../Components/StatusSidebar";
import { FaFilePdf } from "react-icons/fa6";
import TablePDF from "../../component/TablePDF";
import toast from "react-hot-toast";
import DynamicTablePDF from "../../component/TablePDF";

function Users() {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // St
  const { token, collegeUsers, status, error, createdStudent } = useSelector(
    (state) => state.user
  );
  const [loading, setLoading] = useState(false);
  const [pdfData, setPdfData] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);
  const isFetching = useRef(false); // Use ref to persist fetching state
  const [filterCriteria, setFilterCriteria] = useState({
    branch: "",
    cgpa: "",
    gender: "",
    semester: "",
    tenthPercent: "",
    twelfthPercent: "",
    subCollege: "", // Add subCollege
    courses: "", // Add degree
    studentType: '',
    year: "", // Add year
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);

  const onFilterChange = (newFilter) => {
    setFilterCriteria(newFilter);
  };

  const handleSearch = (term) => {
    setSearchTerm(term.toLowerCase());
  };

  // In UsersPage.js
  const handleStatusClick = () => {
    console.log("Status button clicked"); // Check if this logs in the console
    setIsSidebarOpen(true);
    document.body.style.overflow = "hidden";
  };

  // In StatusSidebar.js
  const closeSidebar = () => {
    setIsSidebarOpen(false);
    document.body.style.overflow = "auto"; // Restore scrolling
  };

  const handleCreateStudent = async (studentData) => {
    setIsCreatingStudent(true); // Set loading state to true
    try {
      await dispatch(createStudent(studentData)).unwrap();
      toast.success("Student created successfully!");
      setIsOpen(false);
    } catch (error) {
      toast.error(`${error}`, { position: "top-center" });
    } finally {
      setIsCreatingStudent(false); // Reset loading state
    }
  };

  const handleOpenPopup = () => {
    setIsOpen(true);
  };

  const handleClosePopup = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (token && !isFetching.current) {
      const fetchCollegeUsers = async () => {
        try {
          const decodedToken = jwtDecode(token);
          const collegeId = decodedToken.college;

          if (!collegeId) {
            toast.error("Invalid token or college ID missing");
            return;
          }

          isFetching.current = true; // Prevent concurrent fetches
          setLoading(true);

          await dispatch(listUsersOfCollege(collegeId)).unwrap();
        } catch (err) {
          toast.error(err || "Failed to fetch users");
        } finally {
          setLoading(false);
          isFetching.current = false; // Reset fetching state
        }
      };

      fetchCollegeUsers();
    }
  }, [dispatch, token]); // Minimize dependencies

  const filteredUsers = collegeUsers.filter((user) => {
    if (user.role === "tnp_admin") return false;

    // Apply search term filter
    if (searchTerm) {
      const fullName = `${user.profile?.firstName || ""} ${
        user.profile?.lastName || ""
      }`.toLowerCase();
      const collegeID = user.profile?.collegeID?.toLowerCase() || "";
      const email = user.email.toLowerCase() || "";
      if (
        !fullName.includes(searchTerm) &&
        !collegeID.includes(searchTerm) &&
        !email.includes(searchTerm)
      ) {
        return false;
      }
    }
    // Apply filter criteria
    if (filterCriteria) {
      if (
        filterCriteria.branch &&
        user.profile?.branch !== filterCriteria.branch
      )
        return false;
      if (filterCriteria.year && user.profile?.year !== filterCriteria.year)
        return false;
      if (filterCriteria.studentType && user.profile?.studentType !== filterCriteria.studentType)
        return false;
      if (
        filterCriteria.courses &&
        user.profile?.courses !== filterCriteria.courses
      )
        return false; // Assuming degree is part of user profile
      if (
        filterCriteria.subCollege &&
        user.profile?.subcollege !== filterCriteria.subCollege
      )
        return false; // Assuming subcollege is part of user profile
      if (filterCriteria.year && user.profile?.year !== filterCriteria.year)
        return false;
      if (
        filterCriteria.cgpa &&
        user.profile?.academicRecords?.cgpa?.[0]?.semesters?.[0]?.cgpa <
          filterCriteria.cgpa
      )
        return false;
      if (
        filterCriteria.semester &&
        user.profile?.semester !== filterCriteria.semester
      )
        return false;
      if (
        filterCriteria.tenthPercent &&
        user.profile?.academicRecords?.twelfth?.percentage <
          filterCriteria.tenthPercent
      )
        return false;
      if (
        filterCriteria.twelfthPercent &&
        user.profile?.academicRecords?.tenth?.percentage <
          filterCriteria.twelfthPercent
      )
        return false;
      if (
        filterCriteria.gender &&
        user.profile?.gender !== filterCriteria.gender
      )
        return false;
    }

    return true;
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (token && !isFetching.current) {
        // Place API call logic here
      }
    }, 300); // Adjust delay as needed

    return () => clearTimeout(timeout);
  }, [token]);

  const handleUserClick = (userId) => {
    // console.log();

    navigate(`/tadmin/userprofile/${userId}`); // Step 3: Navigate to UserProfile with userId
  };

  const sortedUsers = filteredUsers.sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  const handleExport = () => {
    const formattedData = filteredUsers.map((user) => ({
      Name: `${user.profile?.firstName || ""} ${
        user.profile?.lastName || "N/A"
      }`,
      CollegeID: user.profile?.collegeID || "N/A" ,
      Branch: `${user.profile?.branch || "N/A"}/${
        user.profile?.courses || "N/A"
      }`,
      YearSem: `${user.profile?.year || "N/A"}/${
        user.profile?.semester || "N/A"
      }`,
      CGPA:
        user.profile?.academicRecords?.cgpa?.[0]?.semesters?.[0]?.cgpa || "N/A",
      Phone: user.profile?.phoneNum || "N/A",
    }));

    setPdfData(formattedData);
    setIsPDFPreviewOpen(true);
  };

  return (
    <div className="relative flex flex-col flex-1 bg-[#A3B5C0] min-h-screen rounded-l-[35px]">
      <Header
        filterCriteria={filterCriteria}
        onSearch={handleSearch}
        onFilterChange={onFilterChange}
      />
      <div className="flex justify-between mx-6 space-x-6 pt-5">
        <div className="sticky flex">
          <h1 className="text-[28px] font-bold p-2  ml-7 text-[rgb(22,22,59)]">
            Students
          </h1>
        </div>

        <div className="flex items-center ">
          <button
            onClick={handleOpenPopup}
            className={`flex items-center gap-2 px-6 py-2 mr-7 bg-[#3e79a7] text-white font-semibold rounded-2xl hover:bg-[#21537a] text-[16px] ${
              isCreatingStudent ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isCreatingStudent} // Disable button while creating student
          >
            {isCreatingStudent ? (
              <Loading />
            ) : (
              <BsPersonFillAdd className="text-[18px]" />
            )}
            {isCreatingStudent ? "Creating..." : "Add Student"}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2 mr-5 bg-[#3e79a7] text-white font-semibold rounded-2xl hover:bg-[#21537a] text-[16px]"
          >
            <FaFilePdf className="text-[17px]" />
            Export
          </button>
          <button
            onClick={handleStatusClick}
            className="flex items-center gap-2 px-6 py-2 mr-5 bg-[#3e79a7] text-white font-semibold rounded-2xl hover:bg-[#21537a] text-[16px]"
          >
            <AiFillDashboard className="text-[17px]" />
            Status
          </button>
        </div>

        {isOpen && (
          <CreateStudentPopup
            isOpen={isOpen}
            onClose={handleClosePopup}
            onCreateStudent={handleCreateStudent}
            status={status}
            error={error}
            createdStudent={createdStudent}
          />
        )}
      </div>
      {loading ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loading />
        </div>
      ) : (
        <div className="flex justify-center p-6">
          {filteredUsers.length === 0 ? (
            <div className="text-center text-gray-600">
              No users found for this college.
            </div>
          ) : (
            <table className="w-full border-collapse bg-[#cdd9e156] backdrop-blur-sm shadow-md rounded-lg overflow-hidden">
              <thead className="bg-[#cdd9e1a7]">
                <tr>
                  <th className="text-left p-4 text-sm font-bold">Name</th>
                  <th className="text-left p-4 text-sm font-bold">
                    Sub College
                  </th>
                  <th className="text-left p-4 text-sm font-bold">
                    College ID
                  </th>
                  <th className="text-left p-4 text-sm font-bold">Branch</th>
                  <th className="text-left p-4 text-sm font-bold">Year/Sem</th>
                  <th className="text-left p-4 text-sm font-bold">CGPA</th>
                  <th className="text-left p-4 text-sm font-bold">Phone</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user, index) => (
                  <tr
                    key={user._id}
                    onClick={() => handleUserClick(user._id)}
                    className={`${
                      index % 2 === 0 ? "bg-[#cdd9e165]" : ""
                    } hover:bg-[#ffffff82] hover:backdrop-blur-sm hover:text-blue-500 hover:shadow-lg cursor-pointer`}
                  >
                    <td className="flex items-center gap-3 p-3 border border-[#cdd9e1bc]">
                      <div className="flex flex-col items-center">
                        <img
                          src={user.profile?.profilePic}
                          alt="Profile Image"
                          className="w-10 h-10 object-cover rounded-full shadow-sm"
                        />
                        <span className="text-xs mt-1 bg-sky-400 px-1 border-[1px] rounded-sm border-gray-500 font-normal text-white text-center">
                          {user.profile?.courses}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {`${user.profile?.firstName || ""} ${
                          user.profile?.lastName || "New User"
                        }`}
                      </span>
                    </td>

                    <td className="p-3 border border-[#cdd9e1bc]">
                      {user.profile?.subcollege || "N/A"}
                    </td>
                    <td className="p-3 border border-[#cdd9e1bc]">
                      {user.profile?.collegeID || "N/A"}
                    </td>
                    <td className="p-3 border border-[#cdd9e1bc]">
                      {user.profile?.branch || "N/A"}
                    </td>
                    <td className="p-3 border border-[#cdd9e1bc]">
                      {`${user.profile?.year || "N/A"}/${
                        user.profile?.semester || "N/A"
                      }`}
                    </td>
                    <td className="p-3 border border-[#cdd9e1bc]">
                      {user.profile?.academicRecords?.cgpa?.[0]?.semesters?.[0]
                        ?.cgpa || "N/A"}
                    </td>
                    <td className="p-3 border border-[#cdd9e1bc]">
                      {user.profile?.phoneNum || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      <StatusSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        filteredUsers={filteredUsers}
      />

      {/* PDF Preview Modal */}
      {isPDFPreviewOpen && (
        <DynamicTablePDF
          data={pdfData}
          logo="https://cdn.universitykart.com//Content/upload/admin/regycmyd.21e.jpeg"
          headers={["Name", "CollegeID", "Branch", "YearSem", "CGPA", "Phone"]}
          title="All Students Data"
          subtitle="List of  students in the college."
          onClose={() => setIsPDFPreviewOpen(false)}
        />
      )}
    </div>
  );
}

export default Users;
