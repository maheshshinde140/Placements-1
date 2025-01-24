import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchUserById,
  updateStudentProfile,
  updateProfilePic,
} from "../../redux/userSlice";
import { jwtDecode } from "jwt-decode";
import { IoImagesOutline } from "react-icons/io5";
import { MdModeEdit, MdSave } from "react-icons/md";
import Loading from "../../component/Loading";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import jsPDF from "jspdf";
import {
  FaEnvelope,
  FaPhone,
  FaGraduationCap,
  FaCalendarAlt,
  FaBook,
} from "react-icons/fa";

function Home() {
  const dispatch = useDispatch();
  const { token, user, status, error } = useSelector((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    studentName: "",
    firstname: "",
    lastname: "",
    year: "",
    userEmail: "",
    semester: "",
    gender: "",
    branch: "",
    tbtId: "",
    phone: "",
    dob: "",
    session: "",
    address: "",
    email: "",
    address: "",
    tenthSchool: "",
    tenthScore: "",
    twelfthSchool: "",
    twelfthScore: "",
    diplomacollege: "",
    diplomacollegeScore: "",
    jee: "",
    gap: "",
    mhtcet: "",
    cgpa: [],
    backlogs: [],
    currentStatus: {
      companyName: "",
      position: "",
      duration: "",
      jobType: "",
      location: "",
      startDate: "",
      endDate: "",
    },
    achievements: "",
    skills: "",
    suspension: {
      isSuspended: false, // Default value
      suspensionEndDate: null, // Default value
    },
  });

  const [profilePic, setProfilePic] = useState(null); // State for profile picture
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const debounceTimeout = useRef(null); // Ref to store the timeout ID

  useEffect(() => {
    if (token && !user?.profile) {
      // Clear the previous timeout if it exists
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      // Set a new timeout with a delay (e.g., 500ms)
      debounceTimeout.current = setTimeout(() => {
        setLoading(true);
        try {
          const decoded = jwtDecode(token);
          const userId = decoded.id;
          dispatch(fetchUserById(userId)).then(() => {
            setLoading(false);
          });
        } catch (error) {
          console.error("Error decoding token", error);
          setLoading(false);
        }
      }, 5000); // 500ms delay
    }

    // Cleanup function to clear the timeout on unmount or dependency change
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [token, dispatch, user?.profile]);

  useEffect(() => {
    let timeoutId;
    if (loading) {
      timeoutId = setTimeout(() => {
        toast.warn("Taking too long to load. Refreshing...", {
          position: "top-center",
        });
        Cookies.remove("mpsp");
        localStorage.removeItem("persist:root");
        window.location.reload();
      }, 6000); // 1 minute timeout
    }
    return () => clearTimeout(timeoutId);
  }, [loading]);

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        studentName: user.profile.firstName + " " + user.profile.lastName || "",
        firstname: user.profile.firstName || "",
        lastname: user.profile.lastName || "",
        userEmail: user.profile.userEmail || "",
        branch: user.profile.branch || "",
        year: user.profile.year || "",
        semester: user.profile.semester || "",
        tbtId: user.profile.collegeID || "",
        phone: user.profile.phoneNum || "",
        dob: user.profile.dob?.split("T")[0] || "",
        email: user.email || "",
        session: user.profile.session || "2024-2025", // Set session from user profile
        address: user.profile.address || "",
        gender: user.profile.gender || "Male",
        tenthSchool: user.profile.academicRecords?.tenth?.schoolName || "",
        tenthScore: user.profile.academicRecords?.tenth?.percentage || "",
        twelfthScore: user.profile.academicRecords?.twelfth?.percentage || "",
        twelfthSchool: user.profile.academicRecords?.twelfth?.schoolName || "",
        diplomacollege:
          user.profile.academicRecords?.diploma?.collegeName || "",
        diplomacollegeScore:
          user.profile.academicRecords?.diploma?.percentage || "",
        jee: user.profile.academicRecords?.jeeScore || "",
        gap: user.profile.academicRecords?.gap || "",
        mhtcet: user.profile.academicRecords?.mhtCetScore || "",
        cgpa:
          user.profile.academicRecords?.cgpa.length > 0
            ? user.profile.academicRecords.cgpa
            : [{ semesters: [{ semester: "", cgpa: "" }] }],
        backlogs: user.profile.academicRecords?.backlogs || [],
        currentStatus: {
          companyName: user.profile.currentStatus?.companyName || "",
          position: user.profile.currentStatus?.position || "",
          duration: user.profile.currentStatus?.duration || "",
          jobType: user.profile.currentStatus?.jobType || "",
          location: user.profile.currentStatus?.location || "",
          startDate: user.profile.currentStatus?.startDate?.split("T")[0] || "",
          endDate: user.profile.currentStatus?.endDate?.split("T")[0] || "",
        },
        achievements: user.profile.achievements.join(", ") || "",
        skills: user.profile.skills.join(", ") || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { id, value } = e.target;

    // Handle nested currentStatus fields
    if (id.startsWith("currentStatus.")) {
      const field = id.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        currentStatus: {
          ...prev.currentStatus,
          [field]: value,
        },
      }));
    } else {
      // Handle regular fields
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("profilePic", file);
      setUploadProgress(10); // Simulating initial progress

      // Simulate gradual progress for a better UX
      const interval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 20, 90)); // Incrementally update to 90%
      }, 500);

      dispatch(updateProfilePic(formData))
        .unwrap()
        .then(() => {
          clearInterval(interval);
          setUploadProgress(100); // Upload complete
          toast.success("Profile picture updated successfully!");
          setTimeout(() => setUploadProgress(0), 1000); // Reset progress bar
        })
        .catch((err) => {
          clearInterval(interval);
          setUploadProgress(0); // Reset on failure
          toast.error(err || "Failed to update profile picture!");
        });
    }
  };

  const handleCgpaChange = (index, semIndex, field, value) => {
    const updatedCgpa = formData.cgpa.map((cgpaObj, cgpaIndex) => {
      if (cgpaIndex === index) {
        return {
          ...cgpaObj,
          semesters: cgpaObj.semesters.map((semesterData, semIndex) => {
            if (semIndex === semIndex) {
              // Use semIndex to identify the correct semester
              return {
                ...semesterData,
                [field]: value,
              };
            }
            return semesterData;
          }),
        };
      }
      return cgpaObj;
    });

    setFormData((prev) => ({ ...prev, cgpa: updatedCgpa }));
  };

  const handleBacklogChange = (index, field, value) => {
    const updatedBacklogs = [...formData.backlogs];
    updatedBacklogs[index] = { ...updatedBacklogs[index], [field]: value };
    setFormData((prev) => ({ ...prev, backlogs: updatedBacklogs }));
  };

  const addCgpa = () => {
    setFormData((prev) => ({
      ...prev,
      cgpa: [...prev.cgpa, { semesters: [{ semester: "", cgpa: "" }] }], // Initialize with empty values
    }));
  };

  const removeCgpa = (index) => {
    const updatedCgpa = formData.cgpa.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, cgpa: updatedCgpa }));
  };

  const addBacklog = () => {
    setFormData((prev) => ({
      ...prev,
      backlogs: [...prev.backlogs, { semester: "", count: "", dead: "" }],
    }));
  };

  const removeBacklog = (index) => {
    const updatedBacklogs = formData.backlogs.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, backlogs: updatedBacklogs }));
  };

  const toggleEditMode = () => {
    if (isEditing) {
      // Prepare data for update in the required format
      const updates = {
        profile: {
          firstName: formData.firstname,
          lastName: formData.lastname,
          phoneNum: formData.phone,
          userEmail: formData.userEmail,
          collegeID: formData.tbtId,
          session: formData.session, // Include session in updates
          address: formData.address,
          gender: formData.gender, // Add this line
          branch: formData.branch,
          year: formData.year, // Extracting year from 'year / semester' format
          semester: formData.semester, // Ensuring semester is correctly extracted
          dob: formData.dob,
          address: formData.address,
          academicRecords: {
            jeeScore: formData.jee,
            gap: formData.gap,
            mhtCetScore: formData.mhtcet,
            twelfth: {
              schoolName: formData.twelfthSchool,
              percentage: parseFloat(formData.twelfthScore),
            },
            diploma: {
              collegeName: formData.diplomacollege,
              percentage: parseFloat(formData.diplomacollegeScore),
            },
            tenth: {
              schoolName: formData.tenthSchool,
              percentage: parseFloat(formData.tenthScore),
            },
            cgpa: formData.cgpa
              .filter((item) =>
                item.semesters.some((sem) => sem.semester && sem.cgpa !== null)
              ) // Filter out invalid entries
              .map((item) => ({
                semesters: item.semesters.map((semesterData) => ({
                  semester: semesterData.semester,
                  cgpa: parseFloat(semesterData.cgpa) || null,
                })),
              })),
            backlogs: formData.backlogs.map((item) => ({
              semester: item.semester,
              count: parseInt(item.count, 10) || 0,
              dead: parseInt(item.dead, 10) || 0,
            })),
          },
          suspension: {
            isSuspended: formData.suspension?.isSuspended || false, // Ensure to set a default value
            suspensionEndDate: formData.suspension?.suspensionEndDate || null, // Set to null if not provided
          },
          studentType: "Regular", // Assuming the student type is regular as per your example
          achievements: formData.achievements.split(", "), // Converting comma-separated string to array
          skills: formData.skills.split(", "), // Converting comma-separated string to array
          currentStatus: {
            isWorking: true, // Assuming the user is working
            companyName: formData.currentStatus.companyName,
            position: formData.currentStatus.position,
            duration: formData.currentStatus.duration,
            jobType: formData.currentStatus.jobType,
            location: formData.currentStatus.location,
            startDate: formData.currentStatus.startDate,
            endDate: formData.currentStatus.endDate,
          },
        },
      };

      // Log the data being sent to verify semester
      console.log("Data being sent for update:", updates);

      dispatch(updateStudentProfile(updates))
        .unwrap()
        .then((response) => {
          console.log("Response from controller:", response); // Log the response from the controller
          toast.success("Profile updated successfully!");
        })
        .catch((err) => {
          // Log the error, if any
          console.error("Error from controller:", err);

          // Extract the detailed error message
          const errorMessage =
            err?.response?.data?.error ||
            err?.message ||
            "Failed to update profile!";

          // Show the detailed error in the toast
          toast.error(errorMessage);
        });
    }
    setIsEditing((prev) => !prev);
  };
  //console.error("Error from controller:", err);

  const handlePreviewPDF = () => {
    try {
      const doc = new jsPDF();

      // Colors and Styling
      const primaryColor = "#2C3E50";
      const lightGray = "#BDC3C7";

      // Add Header Section
      doc.setFillColor(primaryColor);
      doc.rect(0, 0, 215, 45, "F"); // Full-width header

      // Add Profile Picture Placeholder
      const profileImg = user?.profile?.profilePic || "default-profile.png"; // Replace with an actual image path or default image
      try {
        doc.addImage(profileImg, "JPEG", 10, 10, 30, 30);
      } catch (err) {
        console.error("Profile picture not added:", err);
      }

      // Add Name and College Details
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor("#FFFFFF");
      doc.text(String(formData.studentName || "Your Name"), 50, 20); // Name
      doc.setFontSize(16);

      // Handle long college names with word wrapping
      const collegeName =
        formData.collegeName ||
        "Tulsiramji Gaikwad Patil College of Engineering and Technology, Nagpur";
      const collegeLines = doc.splitTextToSize(collegeName, 140); // Wrap text to fit within 140mm width
      doc.text(collegeLines, 50, 30); // Display wrapped text
      doc.setFontSize(8);

      const collegeWebsite =
        formData.collegeWebsite || "https://tnpportal.harittech.in";
      doc.textWithLink("Visit TNP Portal by HarIT Tech Solution", 52, 42, {
        url: collegeWebsite,
      });

      // Section Heading Function
      const addSectionHeading = (title, yPosition) => {
        doc.setFontSize(18);
        doc.setTextColor(primaryColor);
        doc.setFont("Helvetica", "bold");
        doc.text(String(title), 10, yPosition);
        doc.setDrawColor(primaryColor);
        doc.setLineWidth(0.5);
        doc.line(10, yPosition + 2, 200, yPosition + 2); // Horizontal line
      };

      // Add Content
      const addContent = (key, value, x, y) => {
        const safeValue = String(value || "N/A");

        // Add Key and Value
        doc.setFontSize(12);
        doc.setTextColor(lightGray);
        doc.setFont("Helvetica", "bold");
        doc.text(String(key), x, y);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor("#000000");
        doc.text(safeValue, x + 40, y); // Add spacing for value alignment
      };

      // Add Personal Details Section
      addSectionHeading("Personal Details", 55);
      addContent("Email:", formData.email, 15, 65);
      addContent("Phone:", formData.phone, 15, 75);
      addContent("Branch:", formData.branch, 15, 85);
      addContent("Year:", formData.year, 15, 95);
      addContent("Semester:", formData.semester, 15, 105);
      addContent("College ID:", formData.tbtId, 15, 115);
      addContent("Session:", formData.session, 15, 125);
      addContent("Gender:", formData.gender, 15, 135);
      addContent("Date of Birth:", formData.dob, 15, 145);

      // Add Academic Details Section
      addSectionHeading("Academic Details", 155);
      addContent("10th School:", formData.tenthSchool, 15, 165);
      addContent("10th Score:", formData.tenthScore, 15, 175);
      addContent("12th School:", formData.twelfthSchool, 15, 185);
      addContent("12th Score:", formData.twelfthScore, 15, 195);
      addContent("JEE Score:", formData.jee, 15, 205);
      addContent("MHT CET Score:", formData.mhtcet, 15, 215);

      // Add CGPA Details Section
      addSectionHeading("CGPA Details", 225);
      let cgpaYOffset = 235; // Dynamic Y offset for CGPA details
      (formData.cgpa || []).forEach((cgpaObj, index) => {
        cgpaObj.semesters.forEach((semesterData, semIndex) => {
          addContent(
            `${semesterData.semester} Semester:`,
            semesterData.cgpa,
            20,
            cgpaYOffset
          );
          cgpaYOffset += 10; // Add spacing between rows
        });
      });

      // Add Backlog Details Section
      addSectionHeading("Backlog Details", cgpaYOffset + 15); // Add gap after CGPA section
      let backlogYOffset = cgpaYOffset + 25; // Dynamic Y offset for backlog details
      (formData.backlogs || []).forEach((backlog, index) => {
        addContent(
          `${backlog.semester} Semester:`,
          `${backlog.count || 0} live, ${backlog.dead || 0} dead`,
          15,
          backlogYOffset
        );
        backlogYOffset += 15; // Add spacing between rows
      });

      // Check if the page is full
      if (backlogYOffset > 280) {
        doc.addPage();
        backlogYOffset = 20; // Reset the Y offset for the new page
      }

      // Add Achievements and Skills Section
      addSectionHeading("Achievements & Skills", backlogYOffset + 15);
      addContent(
        "Achievements:",
        formData.achievements,
        15,
        backlogYOffset + 25
      );
      addContent("Skills:", formData.skills, 15, backlogYOffset + 35);

      // Add Current Status Section
      addSectionHeading("Current Status", backlogYOffset + 45);
      addContent(
        "Company Name:",
        formData.currentStatus.companyName,
        15,
        backlogYOffset + 55
      );
      addContent(
        "Position:",
        formData.currentStatus.position,
        15,
        backlogYOffset + 65
      );
      addContent(
        "Duration:",
        formData.currentStatus.duration,
        15,
        backlogYOffset + 75
      );
      addContent(
        "Job Type:",
        formData.currentStatus.jobType,
        15,
        backlogYOffset + 85
      );
      addContent(
        "Location:",
        formData.currentStatus.location,
        15,
        backlogYOffset + 95
      );
      addContent(
        "Start Date:",
        formData.currentStatus.startDate,
        15,
        backlogYOffset + 105
      );
      addContent(
        "End Date:",
        formData.currentStatus.endDate,
        15,
        backlogYOffset + 115
      );

      // Save and Preview PDF
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 py-6 px-4">
      {loading ? ( // Add this conditional rendering
        <div className="">
          <Loading />
        </div>
      ) : (
        <div className="w-full mx-auto border-[2px] border-gray-600 bg-opacity-40 bg-white backdrop-blur-md rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative h-32 w-32 overflow-hidden border-[3px] border-gray-600 rounded-md bg-gray-200 group">
                {/* Profile Picture */}
                <img
                  src={user?.profile?.profilePic || "/default-profile.png"}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ">
                  <label
                    htmlFor="profilePicInput"
                    className="flex flex-col items-center cursor-pointer text-white"
                  >
                    <IoImagesOutline className="font-bold text-2xl" />
                    <span className="text-lg font-semibold">Upload</span>
                  </label>
                </div>

                {/* Progress Bar */}
                {uploadProgress > 0 && (
                  <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center">
                    <span className="text-white mb-2 text-sm font-semibold animate-pulse">
                      {uploadProgress}%
                    </span>
                    <div className="w-3/4 bg-gray-300 rounded-full h-6 shadow-inner">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-600 h-6 rounded-full shadow-md transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <input
                  id="profilePicInput"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                  className="hidden"
                />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {formData.studentName}
                </h1>
                <div className="">
                  <span className=" font-bold text-xs text-blue-600">
                    {formData.email}
                  </span>{" "}
                  <p className="text-md mt-1 font-bold text-gray-600">
                    {formData.branch}{" "}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={toggleEditMode}
                className={`relative flex items-center justify-center gap-2 py-3 px-6 text-lg font-medium rounded-lg transition-all duration-300 ease-in-out border-2 ${
                  isEditing
                    ? "bg-green-500 text-white border-green-500 hover:bg-transparent hover:text-green-500"
                    : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100 hover:text-black"
                }`}
              >
                {isEditing ? (
                  <>
                    <MdSave className="text-xl" /> Save Changes
                  </>
                ) : (
                  <>
                    <MdModeEdit className="text-xl" /> Edit
                  </>
                )}
              </button>

              <button
                onClick={handlePreviewPDF}
                className="relative flex items-center justify-center gap-2 py-3 px-6 bg-blue-500 text-white text-lg font-medium rounded-lg border-2 border-blue-500 transition-all duration-300 ease-in-out hover:bg-transparent hover:text-blue-500"
              >
                Export
              </button>
            </div>
          </div>

          {/* Profile Details */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-md font-semibold text-gray-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="firstname"
                value={formData.firstname}
                onChange={handleChange}
                disabled={!isEditing}
                required //
                className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
              />
            </div>
            <div>
              <label className="block text-md font-semibold text-gray-700">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="lastname"
                value={formData.lastname}
                onChange={handleChange}
                disabled={!isEditing}
                required //
                className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
              />
            </div>

            {/* <div>
              <label className="block text-md font-semibold text-gray-700">
                Own Email <span className="text-red-500">*</span>
              </label>
              <input
                id="userEmail"
                value={formData.userEmail}
                onChange={handleChange}
                disabled={!isEditing}
                required // This makes the field required
                className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
              />
            </div> */}

            <div>
              <label className="block text-md font-semibold text-gray-700">
                Current Year <span className="text-red-500">*</span>
              </label>
              <select
                id="year"
                value={formData.year}
                onChange={handleChange}
                disabled={!isEditing}
                required //
                className={`mt-1 block w-full border border-gray-300 rounded-lg p-3 ${
                  isEditing ? "bg-white" : "bg-transparent"
                }`}>
                <option value="1st">1st year</option>
                <option value="2nd">2nd year</option>
                <option value="3rd">3rd year</option>
                <option value="4th">4th year</option>
              </select>
            </div>
            <div>
              <label className="block text-md font-semibold text-gray-700">
                Current Semester <span className="text-red-500">*</span>
              </label>
              <select
                id="semester"
                value={formData.semester}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className={`mt-1 block w-full border border-gray-300 rounded-lg p-3 ${
                  isEditing ? "bg-white" : "bg-transparent"
                }`}
              >
                <option value="1st">1st semester</option>
                <option value="2nd">2nd semester</option>
                <option value="3rd">3rd semester</option>
                <option value="4th">4th semester</option>
                <option value="5th">5th semester</option>
                <option value="6th">6th semester</option>
                <option value="7th">7th semester</option>
                <option value="8th">8th semester</option>
              </select>
            </div>

            <div>
              <label className="block text-md font-semibold text-gray-700">
                Session <span className="text-red-500">*</span>
              </label>
              <select
                id="session"
                value={formData.session}
                onChange={handleChange}
                disabled={!isEditing}
                required //
                className={`mt-1 block w-full border border-gray-300 rounded-lg p-3 ${
                  isEditing ? "bg-white" : "bg-transparent"
                }`} >
                <option value="2023-2024">2023-2024</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>

            <div>
              <label className="block text-md font-semibold text-gray-700">
                Gap Between
              </label>
              <input
                id="gap"
                value={formData.gap}
                onChange={handleChange}
                disabled={!isEditing}
                className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
              />
            </div>

            <div>
              <label className="block text-md font-semibold text-gray-700">
                College ID <span className="text-red-500">*</span>
              </label>
              <input
                id="tbtId"
                value={formData.tbtId}
                onChange={handleChange}
                disabled={!isEditing}
                required //
                className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
              />
            </div>
            <div>
              <label className="block text-md font-semibold text-gray-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers and limit to 10 digits
                  if (/^\d{0,10}$/.test(value)) {
                    handleChange(e); // Call your handleChange function to update state
                  }
                }}
                disabled={!isEditing}
                required
                className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                placeholder="Enter 10-digit phone number"
              />
              {formData.phone && formData.phone.length !== 10 && (
                <p className="text-sm text-red-500 mt-1">
                  Phone number must be 10 digits
                </p>
              )}
            </div>

            <div>
              <label className="block text-md font-semibold text-gray-700">
                Address
              </label>
              <input
                id="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing}
                className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
              />
            </div>

            <div>
              <label className="block text-md font-semibold text-gray-700">
                Branch <span className="text-red-500">*</span>
              </label>
              <select
                id="branch"
                value={formData.branch}
                onChange={handleChange}
                disabled={!isEditing}
                required //
                className={`mt-1 block w-full border border-gray-300 rounded-lg p-3 ${
                  isEditing ? "bg-white" : "bg-transparent"
                }`} >
                <option value="">Select Branch</option>
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="Aero">Aero</option>
                <option value="Bio">Bio</option>
                <option value="Mech">Mech</option>
                <option value="EE">EE</option>
                <option value="ECE">ECE</option>
              </select>
            </div>
            <div>
              <label className="block text-md font-semibold text-gray-700">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                id="gender"
                value={formData.gender} // Ensure to add gender to formData state
                onChange={handleChange}
                disabled={!isEditing}
                required //
                className={`mt-1 block w-full border border-gray-300 rounded-lg p-3 ${
                  isEditing ? "bg-white" : "bg-transparent"
                }`} >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-md font-semibold text-gray-700">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
                disabled={!isEditing}
                required //
                className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
              />
            </div>
          </div>

          {/* Academic Details */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800">
              Academic Details
            </h2>
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-md font-semibold text-gray-700">
                  10th School
                </label>
                <input
                  id="tenthSchool"
                  value={formData.tenthSchool}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block text-md font-semibold text-gray-700">
                  10th Score
                </label>
                <input
                  id="tenthScore"
                  value={formData.tenthScore}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block text-md font-semibold text-gray-700">
                  12th School
                </label>
                <input
                  id="twelfthSchool"
                  value={formData.twelfthSchool}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block text-md font-semibold text-gray-700">
                  12th Score
                </label>
                <input
                  id="twelfthScore"
                  value={formData.twelfthScore}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block text-md font-semibold text-gray-700">
                  Diploma College ( if applicable )
                </label>
                <input
                  id="diplomacollege"
                  value={formData.diplomacollege}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block text-md font-semibold text-gray-700">
                  Diploma Score ( if applicable )
                </label>
                <input
                  id="diplomacollegeScore"
                  value={formData.diplomacollegeScore}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block text-md font-semibold text-gray-700">
                  JEE Score
                </label>
                <input
                  id="jee"
                  value={formData.jee}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                />
              </div>

              <div>
                <label className=" block text-md font-semibold text-gray-700">
                  MHT CET Score
                </label>
                <input
                  id="mhtcet"
                  value={formData.mhtcet}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                />
              </div>

              {/* CGPA Section */}
              {/* CGPA Section */}
              <div>
                <h3 className="text-md font-semibold text-gray-700">
                  Semester-wise CGPA
                </h3>
                {isEditing && (
                  <button
                    onClick={addCgpa}
                    className="mt-2 bg-blue-600 text-white py-1 px-2 rounded"
                  >
                    Add CGPA
                  </button>
                )}
                <ul className="list-disc ml-6 p-2">
                  {formData.cgpa.map((cgpaObj, index) => (
                    <div key={index}>
                      {isEditing
                        ? cgpaObj.semesters.map((semesterData, semIndex) => (
                            <div key={semIndex} className="flex items-center">
                              <input
                                type="text"
                                value={semesterData.semester}
                                onChange={(e) =>
                                  handleCgpaChange(
                                    index,
                                    semIndex,
                                    "semester",
                                    e.target.value
                                  )
                                }
                                placeholder="Semester"
                                className="border border-gray-300 rounded p-1 mr-2"
                              />
                              <input
                                type="number"
                                value={semesterData.cgpa}
                                onChange={(e) =>
                                  handleCgpaChange(
                                    index,
                                    semIndex,
                                    "cgpa",
                                    e.target.value
                                  )
                                }
                                placeholder="CGPA"
                                className="border border-gray-300 rounded p-1 mr-2"
                              />
                              <button
                                onClick={() => removeCgpa(index)}
                                className="bg-red-600 text-white py-1 px-2 rounded"
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        : cgpaObj.semesters.map((semesterData, semIndex) => (
                            <li key={semIndex}>
                              <span className="font-normal">
                                {semesterData.semester} Semester:{" "}
                              </span>
                              <span className="font-semibold text-sky-600">
                                {semesterData.cgpa} CGPA
                              </span>
                            </li>
                          ))}
                    </div>
                  ))}
                </ul>
              </div>

              {/* Backlog Section */}
              <div className="">
                <h3 className="text-md font-semibold text-gray-700">
                  Backlogs
                </h3>
                {isEditing && (
                  <button
                    onClick={addBacklog}
                    className="mt-2 bg-blue-600 text-white py-1 px-2 rounded"
                  >
                    Add Backlog
                  </button>
                )}
                <ul className="list-disc ml-6 p-2">
                  {formData.backlogs.map((backlog, index) => (
                    <div key={index} className="flex items-center">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={backlog.semester}
                            onChange={(e) =>
                              handleBacklogChange(
                                index,
                                "semester",
                                e.target.value
                              )
                            }
                            placeholder="Semester"
                            className="border border-gray-300 rounded p-1 mr-2"
                          />
                          <input
                            type="number"
                            value={backlog.count}
                            onChange={(e) =>
                              handleBacklogChange(
                                index,
                                "count",
                                e.target.value
                              )
                            }
                            placeholder="Count"
                            className="border border-gray-300 rounded p-1 mr-2"
                          />
                          <input
                            type="number"
                            value={backlog.dead}
                            onChange={(e) =>
                              handleBacklogChange(index, "dead", e.target.value)
                            }
                            placeholder="Dead"
                            className="border border-gray-300 rounded p-1 mr-2"
                          />
                          <button
                            onClick={() => removeBacklog(index)}
                            className="bg-red-600 text-white py-1 px-2 rounded"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <li>
                          <span className="font-normal">
                            {backlog.semester} Semester:{" "}
                          </span>
                          <span className="font-semibold text-red-600">
                            {backlog.count} live, {backlog.dead} dead
                          </span>
                        </li>
                      )}
                    </div>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Achievements and Skills */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800">
              Achievements & Skills
            </h2>
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="block text-md font-semibold text-gray-700">
                  Achievements
                </h3>
                {isEditing ? (
                  <textarea
                    id="achievements"
                    value={formData.achievements}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                  />
                ) : (
                  <ul className="list-disc ml-6 p-2">
                    {user?.profile?.achievements?.map((achievement, index) => (
                      <li key={index} className="text-sm">
                        {achievement}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="block text-md font-semibold text-gray-700">
                  Skills
                </h3>
                {isEditing ? (
                  <textarea
                    id="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    className="w-full border rounded p-2"
                  />
                ) : (
                  <ul className="list-disc ml-6 p-2">
                    {user?.profile?.skills?.map((skill, index) => (
                      <li key={index} className="text-sm">
                        {skill}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800">Current Status</h2>
            <div className=" mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-md font-semibold text-gray-700">
                  Company Name
                </label>
                <input
                  id="currentStatus.companyName"
                  value={formData.currentStatus.companyName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                />
              </div>
              <div>
                <label className="block text-md font-semibold text-gray-700">
                  Position
                </label>
                <input
                  id="currentStatus.position"
                  value={formData.currentStatus.position}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                />
              </div>
              <div>
                <label className="block text-md font-semibold text-gray-700">
                  Duration
                </label>
                <input
                  id="currentStatus.duration"
                  value={formData.currentStatus.duration}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                />
              </div>
              <div>
                <label className="block text-md font-semibold text-gray-700">
                  Job Type
                </label>
                <input
                  id="currentStatus.jobType"
                  value={formData.currentStatus.jobType}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                />
              </div>
              <div>
                <label className="block text-md font-semibold text-gray-700">
                  Location
                </label>
                <input
                  id="currentStatus.location"
                  value={formData.currentStatus.location}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                />
              </div>
              <div>
                <label className="block text-md font-semibold text-gray-700">
                  Start Date
                </label>
                <input
                  id="currentStatus.startDate"
                  type="date"
                  value={formData.currentStatus.startDate}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                />
              </div>
              <div>
                <label className="block text-md font-semibold text-gray-700">
                  End Date
                </label>
                <input
                  id="currentStatus.endDate"
                  type="date"
                  value={formData.currentStatus.endDate}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                />
              </div>
            </div>
          </div>

          {/* Applied Jobs */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800">Applied Jobs</h2>
            <div className="space-y-2 mt-4">
              {user?.profile?.appliedJobsHistory?.map((job, index) => (
                <div
                  key={index}
                  className="space-y-2 bg-white/80 shadow-sm rounded-lg p-4"
                >
                  <p className="font-medium">
                    <span className="font-semibold">{job.jobId.title}</span> at{" "}
                    {job.jobId.company}
                  </p>
                  <p className="text-xs">
                    Applied on: {new Date(job.appliedOn).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
