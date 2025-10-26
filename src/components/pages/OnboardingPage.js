"use client";

import React, { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Users,
  Upload,
  Download,
  UserPlus,
  FileSpreadsheet,
} from "lucide-react";
import api from "../../config/api";

export default function OnboardingPage() {
  const [activeTab, setActiveTab] = useState("manual");
  const [manualForm, setManualForm] = useState({
    full_name: "",
    username: "",
    role: "",
    phone_number: "",
    register_number: "",
    parent_phone: "",
    group_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);
  const [errors, setErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [defaultGroups, setDefaultGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupsLoaded, setGroupsLoaded] = useState(false);

  const loadDefaultGroups = async () => {
    if (groupsLoaded || loadingGroups) return;

    setLoadingGroups(true);
    try {
      const response = await api.get("/users/default-groups");
      setDefaultGroups(response.data.groups);
      setGroupsLoaded(true);
    } catch (error) {
      console.error("Failed to load default groups:", error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setSuccessMessage("");

    try {
      const response = await api.post("/users/create-user", manualForm);

      // Reset form
      setManualForm({
        full_name: "",
        username: "",
        role: "",
        phone_number: "",
        register_number: "",
        parent_phone: "",
        group_id: "",
      });

      setSuccessMessage("User created successfully!");
    } catch (error) {
      setSuccessMessage("");
      setErrors([error.response?.data?.error || "Failed to create user"]);
    } finally {
      setLoading(false);
    }
  };

  const handleExcelUpload = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      setErrors(["Please select an Excel file"]);
      return;
    }

    setLoading(true);
    setErrors([]);
    setUploadProgress(0);
    setUploadResults(null);

    try {
      const formData = new FormData();
      formData.append("excelFile", excelFile);

      const response = await api.post("/users/bulk-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      setUploadResults(response.data.results);
      setExcelFile(null);
    } catch (error) {
      setErrors([error.response?.data?.error || "Failed to upload Excel file"]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get("/users/download-template", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "user_onboarding_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setErrors(["Failed to download template"]);
    }
  };

  const getTotalErrors = () => {
    if (!uploadResults) return 0;
    return (
      uploadResults.teachers.errors.length +
      uploadResults.students.errors.length +
      uploadResults.parents.errors.length
    );
  };

  const getTotalSuccess = () => {
    if (!uploadResults) return 0;
    return (
      uploadResults.teachers.success +
      uploadResults.students.success +
      uploadResults.parents.success
    );
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          User Onboarding
        </h2>
        <p className="text-gray-600">
          Create users manually or upload via Excel for bulk registration
        </p>
      </div>

      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-800">
              <h3 className="font-semibold mb-2">Errors:</h3>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {successMessage && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-green-800">
              <h3 className="font-semibold mb-2">Success!</h3>
              <p>{successMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full max-w-4xl"
      >
        <TabsList className="grid w-full md:w-fit md:ml-auto grid-cols-2">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Manual Creation
          </TabsTrigger>
          <TabsTrigger value="excel" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Excel Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create User Manually</CardTitle>
              <CardDescription>
                Add individual users to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={manualForm.full_name}
                      onChange={(e) =>
                        setManualForm((prev) => ({
                          ...prev,
                          full_name: e.target.value,
                        }))
                      }
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={manualForm.role}
                      onValueChange={(value) =>
                        setManualForm((prev) => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="faculty">Faculty/Teacher</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {manualForm.role === "faculty" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        value={manualForm.username}
                        onChange={(e) =>
                          setManualForm((prev) => ({
                            ...prev,
                            username: e.target.value,
                          }))
                        }
                        placeholder="Enter username"
                        required
                      />
                      <p className="text-sm text-gray-500">
                        Password will be auto-generated and sent via SMS
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      value={manualForm.phone_number}
                      onChange={(e) =>
                        setManualForm((prev) => ({
                          ...prev,
                          phone_number: e.target.value,
                        }))
                      }
                      placeholder="Enter 10-digit phone number"
                      maxLength={10}
                    />
                  </div>
                </div>

                {manualForm.role === "student" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register_number">Register Number</Label>
                      <Input
                        id="register_number"
                        value={manualForm.register_number}
                        onChange={(e) =>
                          setManualForm((prev) => ({
                            ...prev,
                            register_number: e.target.value,
                          }))
                        }
                        placeholder="Enter register number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parent_phone">Parent Phone Number</Label>
                      <Input
                        id="parent_phone"
                        value={manualForm.parent_phone}
                        onChange={(e) =>
                          setManualForm((prev) => ({
                            ...prev,
                            parent_phone: e.target.value,
                          }))
                        }
                        placeholder="Enter 10-digit parent phone"
                        maxLength={10}
                      />
                    </div>
                  </div>
                )}

                {manualForm.role === "student" && (
                  <div className="space-y-2">
                    <Label htmlFor="group_id">Default Group (Optional)</Label>
                    <Select
                      value={manualForm.group_id}
                      onValueChange={(value) =>
                        setManualForm((prev) => ({ ...prev, group_id: value }))
                      }
                      onOpenChange={(open) => {
                        if (open) {
                          loadDefaultGroups();
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a default group" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingGroups ? (
                          <SelectItem value="loading" disabled>
                            Loading groups...
                          </SelectItem>
                        ) : defaultGroups.length === 0 ? (
                          <SelectItem value="no-groups" disabled>
                            No default groups available
                          </SelectItem>
                        ) : (
                          defaultGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">
                      Assign student to an existing default group
                    </p>
                  </div>
                )}

                <Button type="submit" disabled={loading} className="mt-4 w-32">
                  {loading ? "Creating..." : "Create User"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="excel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Upload via Excel</CardTitle>
              <CardDescription>
                Upload Excel file to create multiple users at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                  <Download className="h-4 w-4" />
                  <Button
                    onClick={handleDownloadTemplate}
                    variant="link"
                    className="p-0 h-auto text-sm text-gray-600 hover:text-gray-800"
                  >
                    Download example template
                  </Button>
                </div>
                <div>
                  <Label htmlFor="excelFile" className="mb-2 block">
                    Select Excel File
                  </Label>
                  <Input
                    id="excelFile"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setExcelFile(e.target.files[0])}
                    className="w-min max-w-full"
                  />
                </div>
              </div>

              <form onSubmit={handleExcelUpload} className="space-y-4">
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !excelFile}
                  className="w-min"
                >
                  {loading ? "Processing..." : "Upload & Process"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {uploadResults && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Results</CardTitle>
                <CardDescription>
                  Summary of the bulk upload process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {getTotalSuccess()}
                    </div>
                    <div className="text-sm text-green-700">
                      Successfully Created
                    </div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {getTotalErrors()}
                    </div>
                    <div className="text-sm text-red-700">Errors</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {uploadResults.teachers.success +
                        uploadResults.parents.success +
                        uploadResults.students.success}
                    </div>
                    <div className="text-sm text-blue-700">Total Processed</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">
                      Teachers: {uploadResults.teachers.success} created
                    </h3>
                    {uploadResults.teachers.errors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-semibold text-red-600">
                          {uploadResults.teachers.errors.length} errors:
                        </p>
                        <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                          {uploadResults.teachers.errors.map((error, index) => (
                            <li key={index}>
                              Row {error.row}: {error.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">
                      Parents: {uploadResults.parents.success} created
                    </h3>
                    {uploadResults.parents.errors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-semibold text-red-600">
                          {uploadResults.parents.errors.length} errors:
                        </p>
                        <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                          {uploadResults.parents.errors.map((error, index) => (
                            <li key={index}>
                              Row {error.row}: {error.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">
                      Students: {uploadResults.students.success} created
                    </h3>
                    {uploadResults.students.errors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-semibold text-red-600">
                          {uploadResults.students.errors.length} errors:
                        </p>
                        <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                          {uploadResults.students.errors.map((error, index) => (
                            <li key={index}>
                              Row {error.row}: {error.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
