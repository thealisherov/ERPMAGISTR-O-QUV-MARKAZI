import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { studentsApi } from "../../api/students.api";
import { paymentsApi } from "../../api/payments.api";
import toast from "react-hot-toast";
import {
  FiUser,
  FiPhone,
  FiCalendar,
  FiBook,
  FiDollarSign,
  FiTrash2,
} from "react-icons/fi";

const StudentDetails = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [studentRes, paymentsRes] = await Promise.all([
          studentsApi.getById(id),
          studentsApi.getPaymentHistory(id),
        ]);

        setStudent(studentRes.data);
        setPaymentHistory(paymentsRes.data || []);
        setGroups(studentRes.data.groups || []);
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAllData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm("Haqiqatan ham bu to'lovni o'chirmoqchimisiz?")) {
      try {
        await paymentsApi.delete(paymentId);
        toast.success("To'lov o'chirildi");
        setPaymentHistory((prev) => prev.filter((p) => p.id !== paymentId));
      } catch (error) {
        console.error("Error deleting payment:", error);
        toast.error("Xatolik yuz berdi");
      }
    }
  };

  if (!student) {
    return (
      <div className="p-6 text-center text-gray-500">O'quvchi topilmadi</div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {student.firstName} {student.lastName}
        </h1>
        <p className="text-gray-600">O'quvchi haqida batafsil ma'lumot</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
              {student.firstName ? student.firstName.charAt(0).toUpperCase() : "?"}
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {student.firstName} {student.lastName}
            </h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold mt-2">
              Aktiv
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 text-gray-600">
              <FiPhone className="text-gray-400 mt-1" />
              <div>
                <p>{student.phoneNumber || "Telefon kiritilmagan"}</p>
                {student.parentPhoneNumber && (
                   <p className="text-sm text-gray-500 mt-1">Ota-onasi: {student.parentPhoneNumber}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <FiCalendar className="text-gray-400" />
              <span>
                Qo'shilgan sana:{" "}
                {new Date(student.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Groups Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiBook className="text-blue-600" />
              Guruhlar
            </h3>

            {groups.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
                  >
                    <h4 className="font-semibold text-gray-900">
                      {group.name}
                    </h4>
                    <p className="text-sm text-gray-500">{group.teacherName}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {group.schedule}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Guruhlar topilmadi</p>
            )}
          </div>

          {/* Payment History Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiDollarSign className="text-green-600" />
              To'lovlar Tarixi
            </h3>

            {paymentHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-xs font-semibold text-gray-500">
                        Sana
                      </th>
                      <th className="px-4 py-2 text-xs font-semibold text-gray-500">
                        Summa
                      </th>
                      <th className="px-4 py-2 text-xs font-semibold text-gray-500">
                        Turi
                      </th>
                      <th className="px-4 py-2 text-xs font-semibold text-gray-500">
                        Izoh
                      </th>
                      <th className="px-4 py-2 text-xs font-semibold text-gray-500">
                        Amallar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(payment.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {payment.amount?.toLocaleString()} UZS
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {payment.type}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {payment.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            className="cursor-pointer text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                            title="O'chirish"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">To'lovlar tarixi mavjud emas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;
