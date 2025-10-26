"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  CreditCard,
  Users,
  Search,
  Plus,
  Loader2,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import api from "../../config/api";

export default function FeesCollectionPage() {
  const [activeTab, setActiveTab] = useState("groups");
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupFees, setGroupFees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentFees, setStudentFees] = useState([]);
  const [studentTotals, setStudentTotals] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
  });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  // Form states
  const [newSubjectForm, setNewSubjectForm] = useState({
    name: "",
    description: "",
  });
  const [newFeeForm, setNewFeeForm] = useState({
    subjectId: "",
    categoryId: "",
    amount: "",
    dueDate: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    feeId: "",
    amount: "",
    paymentMethod: "cash",
    notes: "",
  });

  // Load initial data
  useEffect(() => {
    loadGroups();
    loadSubjects();
    loadCategories();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get("/fees/groups");
      setGroups(response.data.groups);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await api.get("/fees/subjects");
      setSubjects(response.data.subjects);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to load subjects");
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get("/fees/categories");
      setCategories(response.data.categories);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to load categories");
    }
  };

  const loadGroupFees = async (groupId) => {
    try {
      setLoading(true);
      const response = await api.get(`/fees/groups/${groupId}/fees`);
      setSelectedGroup(response.data.group);
      setGroupFees(response.data.fees);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to load group fees");
    } finally {
      setLoading(false);
    }
  };

  const searchStudents = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setError("Search query must be at least 2 characters");
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(
        `/fees/students/search?query=${encodeURIComponent(searchQuery)}`
      );
      setSearchResults(response.data.students);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to search students");
    } finally {
      setLoading(false);
    }
  };

  const loadStudentFees = async (studentId) => {
    try {
      setLoading(true);
      const response = await api.get(`/fees/students/${studentId}/fees`);
      setSelectedStudent(response.data.student);
      setStudentFees(response.data.fees);
      setStudentTotals(response.data.totals);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to load student fees");
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentHistory = async (studentId) => {
    try {
      const response = await api.get(`/fees/students/${studentId}/payments`);
      setPaymentHistory(response.data.payments);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to load payment history");
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await api.post("/fees/subjects", newSubjectForm);
      setNewSubjectForm({ name: "", description: "" });
      loadSubjects();
    } catch (error) {
      setError(error.response?.data?.error || "Failed to create subject");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateFee = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await api.post(`/fees/groups/${selectedGroup.id}/fees`, newFeeForm);
      setNewFeeForm({ subjectId: "", categoryId: "", amount: "", dueDate: "" });
      loadGroupFees(selectedGroup.id);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to create fee");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMakePayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await api.post(
        `/fees/students/${selectedStudent.id}/payments`,
        paymentForm
      );
      setPaymentForm({
        feeId: "",
        amount: "",
        paymentMethod: "cash",
        notes: "",
      });
      setShowPaymentForm(false);
      loadStudentFees(selectedStudent.id);
      loadPaymentHistory(selectedStudent.id);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getStatusIcon = (isPaid, isOverdue, dueDate) => {
    if (isPaid) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (isOverdue) return <AlertCircle className="h-4 w-4 text-red-600" />;
    if (dueDate && new Date(dueDate) < new Date())
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    return <Clock className="h-4 w-4 text-yellow-600" />;
  };

  const getStatusText = (isPaid, isOverdue, dueDate, overdueMonths) => {
    if (isPaid) return "Paid";
    if (isOverdue) {
      if (overdueMonths > 0) {
        return `Overdue (${overdueMonths} months)`;
      }
      return "Overdue";
    }
    if (dueDate && new Date(dueDate) < new Date()) return "Overdue";
    return "Pending";
  };

  const getStatusColor = (isPaid, isOverdue, dueDate) => {
    if (isPaid) return "text-green-600 bg-green-100";
    if (isOverdue) return "text-red-600 bg-red-100";
    if (dueDate && new Date(dueDate) < new Date())
      return "text-red-600 bg-red-100";
    return "text-yellow-600 bg-yellow-100";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <CreditCard className="h-8 w-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fees Collection</h2>
          <p className="text-gray-600">
            Manage group fees and student payments
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-800">{error}</div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Group Configuration
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Student Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Groups List */}
            <Card>
              <CardHeader>
                <CardTitle>Default Groups</CardTitle>
                <CardDescription>
                  Select a group to configure fees
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : groups.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No default groups found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {groups.map((group) => (
                      <Button
                        key={group.id}
                        variant={
                          selectedGroup?.id === group.id ? "default" : "outline"
                        }
                        className="w-full justify-start"
                        onClick={() => loadGroupFees(group.id)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        {group.name}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Group Fees Configuration */}
            {selectedGroup && (
              <Card>
                <CardHeader>
                  <CardTitle>Fees for {selectedGroup.name}</CardTitle>
                  <CardDescription>
                    Configure fees for this group
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Create Subject Form */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Create New Subject</h4>
                    <form onSubmit={handleCreateSubject} className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="subjectName">Subject Name *</Label>
                        <Input
                          id="subjectName"
                          value={newSubjectForm.name}
                          onChange={(e) =>
                            setNewSubjectForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Enter subject name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subjectDescription">Description</Label>
                        <Textarea
                          id="subjectDescription"
                          value={newSubjectForm.description}
                          onChange={(e) =>
                            setNewSubjectForm((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Enter subject description"
                          rows={2}
                        />
                      </div>
                      <Button type="submit" disabled={submitting} size="sm">
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Subject"
                        )}
                      </Button>
                    </form>
                  </div>

                  {/* Create Fee Form */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Add Fee for Subject</h4>
                    <form onSubmit={handleCreateFee} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="feeSubject">Subject *</Label>
                          <Select
                            value={newFeeForm.subjectId}
                            onValueChange={(value) =>
                              setNewFeeForm((prev) => ({
                                ...prev,
                                subjectId: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="feeCategory">Category *</Label>
                          <Select
                            value={newFeeForm.categoryId}
                            onValueChange={(value) =>
                              setNewFeeForm((prev) => ({
                                ...prev,
                                categoryId: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id}
                                >
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="feeAmount">Amount (₹) *</Label>
                          <Input
                            id="feeAmount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={newFeeForm.amount}
                            onChange={(e) =>
                              setNewFeeForm((prev) => ({
                                ...prev,
                                amount: e.target.value,
                              }))
                            }
                            placeholder="0.00"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="feeDueDate">Due Date</Label>
                          <Input
                            id="feeDueDate"
                            type="date"
                            value={newFeeForm.dueDate}
                            onChange={(e) =>
                              setNewFeeForm((prev) => ({
                                ...prev,
                                dueDate: e.target.value,
                              }))
                            }
                          />
                          {newFeeForm.categoryId && (
                            <div className="text-xs text-gray-500">
                              {(() => {
                                const category = categories.find(
                                  (c) => c.id === newFeeForm.categoryId
                                );
                                if (category?.name === "Monthly") {
                                  return "💡 Monthly fees: Due date will be set to 1st of next month if not specified";
                                } else if (category?.name === "Yearly") {
                                  return "💡 Yearly fees: Due date will be set to same date next year if not specified";
                                } else if (category?.name === "One-time") {
                                  return "💡 One-time fees: Specify the exact due date";
                                }
                                return "";
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button type="submit" disabled={submitting} size="sm">
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          "Add Fee"
                        )}
                      </Button>
                    </form>
                  </div>

                  {/* Existing Fees */}
                  <div>
                    <h4 className="font-medium mb-3">Current Fees</h4>
                    <div className="text-xs text-gray-500 mb-3">
                      💡 Students keep their assigned fees even if they leave
                      the group later
                    </div>
                    {groupFees.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No fees configured yet
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {groupFees.map((fee) => (
                          <div
                            key={fee.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <div className="font-medium">
                                {fee.subjects.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mr-2">
                                  {fee.fee_categories.name}
                                </span>
                                {formatCurrency(fee.amount)}
                                {fee.due_date && (
                                  <span className="ml-2">
                                    • Due: {formatDate(fee.due_date)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {formatCurrency(fee.amount)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Search */}
            <Card>
              <CardHeader>
                <CardTitle>Search Students</CardTitle>
                <CardDescription>
                  Search by name, phone number, or register number
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter search term..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && searchStudents()}
                  />
                  <Button onClick={searchStudents} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Search Results</h4>
                    {searchResults.map((student) => (
                      <Button
                        key={student.id}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          loadStudentFees(student.id);
                          loadPaymentHistory(student.id);
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        <div className="text-left">
                          <div className="font-medium">{student.full_name}</div>
                          <div className="text-sm text-gray-500">
                            {student.phone_number &&
                              `Phone: ${student.phone_number}`}
                            {student.register_number &&
                              ` • Reg: ${student.register_number}`}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Student Fee Details */}
            {selectedStudent && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Fee Details - {selectedStudent.full_name}
                  </CardTitle>
                  <CardDescription>
                    View and manage student fees
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Fee Summary */}
                  <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(studentTotals.total)}
                      </div>
                      <div className="text-sm text-gray-600">Total Due</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(studentTotals.paid)}
                      </div>
                      <div className="text-sm text-gray-600">Paid</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(
                          studentTotals.pending - studentTotals.overdue
                        )}
                      </div>
                      <div className="text-sm text-gray-600">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(studentTotals.overdue)}
                      </div>
                      <div className="text-sm text-gray-600">Overdue</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowPaymentForm(!showPaymentForm)}
                      disabled={studentTotals.pending === 0}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Make Payment
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Payment History
                    </Button>
                  </div>

                  {/* Payment Form */}
                  {showPaymentForm && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Record Payment</h4>
                      <form onSubmit={handleMakePayment} className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="paymentFee">Subject *</Label>
                          <Select
                            value={paymentForm.feeId}
                            onValueChange={(value) =>
                              setPaymentForm((prev) => ({
                                ...prev,
                                feeId: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {studentFees
                                .filter((fee) => fee.pending_amount > 0)
                                .map((fee) => (
                                  <SelectItem key={fee.id} value={fee.fees.id}>
                                    {fee.fees.subjects.name} -{" "}
                                    {formatCurrency(fee.pending_amount)} pending
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="paymentAmount">Amount (₹) *</Label>
                            <Input
                              id="paymentAmount"
                              type="number"
                              step="0.01"
                              min="0"
                              value={paymentForm.amount}
                              onChange={(e) =>
                                setPaymentForm((prev) => ({
                                  ...prev,
                                  amount: e.target.value,
                                }))
                              }
                              placeholder="0.00"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="paymentMethod">Method</Label>
                            <Select
                              value={paymentForm.paymentMethod}
                              onValueChange={(value) =>
                                setPaymentForm((prev) => ({
                                  ...prev,
                                  paymentMethod: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="cheque">Cheque</SelectItem>
                                <SelectItem value="online">Online</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentNotes">Notes</Label>
                          <Textarea
                            id="paymentNotes"
                            value={paymentForm.notes}
                            onChange={(e) =>
                              setPaymentForm((prev) => ({
                                ...prev,
                                notes: e.target.value,
                              }))
                            }
                            placeholder="Payment notes (optional)"
                            rows={2}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" disabled={submitting} size="sm">
                            {submitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Recording...
                              </>
                            ) : (
                              "Record Payment"
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPaymentForm(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Payment History */}
                  {showPaymentHistory && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Payment History</h4>
                      {paymentHistory.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          No payments recorded yet
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {paymentHistory.map((payment) => (
                            <div
                              key={payment.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div>
                                <div className="font-medium">
                                  {payment.fees.subjects.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {payment.fees.groups.name} •{" "}
                                  {formatDate(payment.payment_date)}
                                </div>
                                {payment.notes && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    {payment.notes}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-green-600">
                                  {formatCurrency(payment.amount)}
                                </div>
                                <div className="text-sm text-gray-500 capitalize">
                                  {payment.payment_method}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fee Details */}
                  <div>
                    <h4 className="font-medium mb-3">Fee Breakdown</h4>
                    {studentFees.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No fees assigned to this student
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {studentFees.map((fee) => (
                          <div
                            key={fee.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {getStatusIcon(
                                fee.is_paid,
                                fee.isOverdue,
                                fee.fees.due_date
                              )}
                              <div>
                                <div className="font-medium">
                                  {fee.fees.subjects.name}
                                  <span className="ml-2 inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {fee.fees.fee_categories.name}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {fee.fees.groups.name}
                                  {fee.nextDueDate && (
                                    <span>
                                      {" "}
                                      • Next Due: {formatDate(fee.nextDueDate)}
                                    </span>
                                  )}
                                  {fee.overdueMonths > 0 && (
                                    <span className="text-red-600 font-medium">
                                      {" "}
                                      • {fee.overdueMonths} months overdue
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {formatCurrency(fee.paid_amount)} /{" "}
                                {formatCurrency(fee.total_amount)}
                              </div>
                              <div className="text-sm">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                    fee.is_paid,
                                    fee.isOverdue,
                                    fee.fees.due_date
                                  )}`}
                                >
                                  {getStatusText(
                                    fee.is_paid,
                                    fee.isOverdue,
                                    fee.fees.due_date,
                                    fee.overdueMonths
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
