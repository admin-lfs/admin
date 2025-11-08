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
import { Checkbox } from "../ui/checkbox";
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Save,
  Download,
  RefreshCw,
  Clock,
  Users,
  BookOpen,
  Settings,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import api from "../../config/api";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function TimetablePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Step 1: Class Selection
  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [considerExisting, setConsiderExisting] = useState(false);

  // Step 2: Subject-Teacher Mapping
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [subjectTeacherMappings, setSubjectTeacherMappings] = useState({});

  // Step 3: Day-Wise Timing Configuration
  const [dayConfigs, setDayConfigs] = useState({});

  // Step 4: Constraint Settings
  const [constraints, setConstraints] = useState({
    maxClassesPerDayPerClass: 8,
    minClassesPerDayPerClass: 4,
    maxClassesPerDayPerTeacher: 6,
    avoidConsecutiveSameSubject: false,
    teacherBreakGap: 0,
  });

  // Step 5: Generated Timetable
  const [generatedTimetables, setGeneratedTimetables] = useState({});
  const [violations, setViolations] = useState({});

  // Load initial data
  useEffect(() => {
    loadClasses();
    loadSubjects();
    loadTeachers();
    loadRooms();
  }, []);

  const loadClasses = async () => {
    try {
      const response = await api.get("/timetable/classes");
      setClasses(response.data.classes || []);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to load classes");
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await api.get("/timetable/subjects");
      setSubjects(response.data.subjects || []);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to load subjects");
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await api.get("/timetable/teachers");
      setTeachers(response.data.teachers || []);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to load teachers");
    }
  };

  const loadRooms = async () => {
    try {
      const response = await api.get("/timetable/rooms");
      setRooms(response.data.rooms || []);
    } catch (error) {
      // Rooms might not exist yet, that's okay
      setRooms([]);
    }
  };

  // Initialize day configs
  useEffect(() => {
    if (selectedClasses.length > 0 && Object.keys(dayConfigs).length === 0) {
      const initialConfigs = {};
      DAYS.forEach((day) => {
        initialConfigs[day] = {
          enabled: day !== "Sunday",
          startTime: "8:30 AM",
          endTime: "3:30 PM",
          classDuration: 45,
          breaks: [],
        };
      });
      setDayConfigs(initialConfigs);
    }
  }, [selectedClasses]);

  // Initialize subject-teacher mappings for selected classes
  useEffect(() => {
    if (selectedClasses.length > 0) {
      const newMappings = { ...subjectTeacherMappings };
      selectedClasses.forEach((classId) => {
        if (!newMappings[classId]) {
          newMappings[classId] = [];
        }
      });
      setSubjectTeacherMappings(newMappings);
    }
  }, [selectedClasses]);

  const handleNext = () => {
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await api.post("/timetable/generate", {
        groupIds: selectedClasses,
        considerExisting,
        subjectTeacherMappings,
        dayConfigs,
        constraints,
      });

      const results = {};
      const violations = {};

      response.data.results.forEach((result) => {
        if (result.success) {
          results[result.groupId] = result.slots || [];
          violations[result.groupId] = {
            warnings: result.warnings || [],
            errors: result.errors || [],
          };
        } else {
          violations[result.groupId] = {
            errors: [{ message: result.error || "Generation failed" }],
          };
        }
      });

      setGeneratedTimetables(results);
      setViolations(violations);
      setCurrentStep(6); // Move to preview step
      setSuccess("Timetable generated successfully!");
    } catch (error) {
      setError(error.response?.data?.error || "Failed to generate timetable");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (groupId, timetableName) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const slots = generatedTimetables[groupId] || [];
      const workingDays = Object.keys(dayConfigs).filter(
        (day) => dayConfigs[day].enabled
      );

      await api.post("/timetable/save", {
        groupId,
        name: timetableName || `Timetable ${new Date().toLocaleDateString()}`,
        description: "",
        workingDays,
        dayConfigs,
        constraints,
        considerExisting,
        slots: slots.map((slot) => ({
          dayOfWeek: slot.day,
          periodNumber: slot.periodNumber,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subjectId: slot.subjectId,
          teacherId: slot.teacherId,
          roomId: slot.roomId || null,
          isBreak: slot.isBreak || false,
          breakName: slot.breakName || null,
        })),
      });

      setSuccess("Timetable saved successfully!");
    } catch (error) {
      setError(error.response?.data?.error || "Failed to save timetable");
    } finally {
      setLoading(false);
    }
  };

  // Render steps
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1ClassSelection />;
      case 2:
        return <Step2SubjectTeacherMapping />;
      case 3:
        return <Step3DayWiseTiming />;
      case 4:
        return <Step4Constraints />;
      case 5:
        return <Step5Generate />;
      case 6:
        return <Step6Preview />;
      default:
        return <Step1ClassSelection />;
    }
  };

  // Step 1: Class Selection
  function Step1ClassSelection() {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Step 1: Class Selection
          </CardTitle>
          <CardDescription>
            Select one or more classes to generate timetables for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Classes</Label>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-md p-4">
              {classes.map((cls) => (
                <div key={cls.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={cls.id}
                    checked={selectedClasses.includes(cls.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedClasses([...selectedClasses, cls.id]);
                      } else {
                        setSelectedClasses(
                          selectedClasses.filter((id) => id !== cls.id)
                        );
                      }
                    }}
                  />
                  <Label htmlFor={cls.id} className="cursor-pointer">
                    {cls.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="consider-existing"
              checked={considerExisting}
              onCheckedChange={setConsiderExisting}
            />
            <Label htmlFor="consider-existing" className="cursor-pointer">
              Consider existing schedules while generating timetable
            </Label>
          </div>

          {selectedClasses.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Please select at least one class to continue
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Step 2: Subject-Teacher Mapping
  function Step2SubjectTeacherMapping() {
    const addSubjectMapping = (classId) => {
      const newMappings = { ...subjectTeacherMappings };
      if (!newMappings[classId]) {
        newMappings[classId] = [];
      }
      newMappings[classId].push({
        subjectId: "",
        teacherId: "",
        maxClassesPerWeek: 5,
        minClassesPerWeek: 0,
        roomId: "",
      });
      setSubjectTeacherMappings(newMappings);
    };

    const removeSubjectMapping = (classId, index) => {
      const newMappings = { ...subjectTeacherMappings };
      newMappings[classId].splice(index, 1);
      setSubjectTeacherMappings(newMappings);
    };

    const updateSubjectMapping = (classId, index, field, value) => {
      const newMappings = { ...subjectTeacherMappings };
      newMappings[classId][index][field] = value;
      setSubjectTeacherMappings(newMappings);
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Step 2: Subject-Teacher Mapping
          </CardTitle>
          <CardDescription>
            Assign subjects and teachers for each selected class
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedClasses.map((classId) => {
            const className = classes.find((c) => c.id === classId)?.name;
            const mappings = subjectTeacherMappings[classId] || [];

            return (
              <div key={classId} className="space-y-4 border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{className}</h3>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => addSubjectMapping(classId)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subject
                  </Button>
                </div>

                {mappings.map((mapping, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-5 gap-4 items-end border-b pb-4"
                  >
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Select
                        value={mapping.subjectId}
                        onValueChange={(value) =>
                          updateSubjectMapping(
                            classId,
                            index,
                            "subjectId",
                            value
                          )
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
                      <Label>Teacher</Label>
                      <Select
                        value={mapping.teacherId}
                        onValueChange={(value) =>
                          updateSubjectMapping(
                            classId,
                            index,
                            "teacherId",
                            value
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Max Classes/Week *</Label>
                      <Input
                        type="number"
                        value={mapping.maxClassesPerWeek}
                        onChange={(e) =>
                          updateSubjectMapping(
                            classId,
                            index,
                            "maxClassesPerWeek",
                            parseInt(e.target.value) || 0
                          )
                        }
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Min Classes/Week</Label>
                      <Input
                        type="number"
                        value={mapping.minClassesPerWeek || 0}
                        onChange={(e) =>
                          updateSubjectMapping(
                            classId,
                            index,
                            "minClassesPerWeek",
                            parseInt(e.target.value) || 0
                          )
                        }
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Room (Optional)</Label>
                      <Select
                        value={mapping.roomId || ""}
                        onValueChange={(value) =>
                          updateSubjectMapping(classId, index, "roomId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {rooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubjectMapping(classId, index)}
                      className="col-span-5"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ))}

                {mappings.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No subjects added yet. Click "Add Subject" to get started.
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  // Step 3: Day-Wise Timing Configuration
  function Step3DayWiseTiming() {
    const updateDayConfig = (day, field, value) => {
      setDayConfigs({
        ...dayConfigs,
        [day]: {
          ...dayConfigs[day],
          [field]: value,
        },
      });
    };

    const addBreak = (day) => {
      const breaks = dayConfigs[day]?.breaks || [];
      updateDayConfig(day, "breaks", [
        ...breaks,
        { name: "", startTime: "10:30 AM", duration: 15 },
      ]);
    };

    const removeBreak = (day, index) => {
      const breaks = dayConfigs[day]?.breaks || [];
      breaks.splice(index, 1);
      updateDayConfig(day, "breaks", breaks);
    };

    const updateBreak = (day, index, field, value) => {
      const breaks = [...(dayConfigs[day]?.breaks || [])];
      breaks[index][field] = value;
      updateDayConfig(day, "breaks", breaks);
    };

    const copyPreviousDay = (day, dayIndex) => {
      if (dayIndex > 0) {
        const previousDay = DAYS[dayIndex - 1];
        const prevConfig = dayConfigs[previousDay];
        if (prevConfig) {
          setDayConfigs({
            ...dayConfigs,
            [day]: { ...prevConfig },
          });
        }
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Step 3: Day-Wise Timing Configuration
          </CardTitle>
          <CardDescription>
            Configure timings and breaks for each working day
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {DAYS.map((day, dayIndex) => {
            const config = dayConfigs[day] || {
              enabled: day !== "Sunday",
              startTime: "8:30 AM",
              endTime: "3:30 PM",
              classDuration: 45,
              breaks: [],
            };

            return (
              <div key={day} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day}`}
                      checked={config.enabled}
                      onCheckedChange={(checked) =>
                        updateDayConfig(day, "enabled", checked)
                      }
                    />
                    <Label
                      htmlFor={`day-${day}`}
                      className="font-semibold text-lg"
                    >
                      {day.toUpperCase()}
                    </Label>
                  </div>
                  {dayIndex > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyPreviousDay(day, dayIndex)}
                    >
                      Copy from {DAYS[dayIndex - 1]}
                    </Button>
                  )}
                </div>

                {config.enabled && (
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="text"
                        value={config.startTime}
                        onChange={(e) =>
                          updateDayConfig(day, "startTime", e.target.value)
                        }
                        placeholder="8:30 AM"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="text"
                        value={config.endTime}
                        onChange={(e) =>
                          updateDayConfig(day, "endTime", e.target.value)
                        }
                        placeholder="3:30 PM"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Class Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={config.classDuration}
                        onChange={(e) =>
                          updateDayConfig(
                            day,
                            "classDuration",
                            parseInt(e.target.value) || 45
                          )
                        }
                        min="15"
                        step="5"
                      />
                    </div>
                  </div>
                )}

                {config.enabled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Breaks</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addBreak(day)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Break
                      </Button>
                    </div>

                    {config.breaks?.map((breakItem, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-4 gap-4 items-end border-b pb-2"
                      >
                        <div className="space-y-2">
                          <Label>Break Name</Label>
                          <Input
                            type="text"
                            value={breakItem.name}
                            onChange={(e) =>
                              updateBreak(day, index, "name", e.target.value)
                            }
                            placeholder="Lunch Break"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Start Time</Label>
                          <Input
                            type="text"
                            value={breakItem.startTime}
                            onChange={(e) =>
                              updateBreak(
                                day,
                                index,
                                "startTime",
                                e.target.value
                              )
                            }
                            placeholder="12:30 PM"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Duration (minutes)</Label>
                          <Input
                            type="number"
                            value={breakItem.duration}
                            onChange={(e) =>
                              updateBreak(
                                day,
                                index,
                                "duration",
                                parseInt(e.target.value) || 15
                              )
                            }
                            min="5"
                            step="5"
                          />
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBreak(day, index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  // Step 4: Constraint Settings
  function Step4Constraints() {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Step 4: Constraint Settings
          </CardTitle>
          <CardDescription>
            Configure constraints for timetable generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Classes per Day (per Class) *</Label>
              <Input
                type="number"
                value={constraints.maxClassesPerDayPerClass}
                onChange={(e) =>
                  setConstraints({
                    ...constraints,
                    maxClassesPerDayPerClass: parseInt(e.target.value) || 8,
                  })
                }
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Min Classes per Day (per Class)</Label>
              <Input
                type="number"
                value={constraints.minClassesPerDayPerClass}
                onChange={(e) =>
                  setConstraints({
                    ...constraints,
                    minClassesPerDayPerClass: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Max Classes per Day (per Teacher)</Label>
              <Input
                type="number"
                value={constraints.maxClassesPerDayPerTeacher}
                onChange={(e) =>
                  setConstraints({
                    ...constraints,
                    maxClassesPerDayPerTeacher: parseInt(e.target.value) || 6,
                  })
                }
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Teacher Break Gap (periods)</Label>
              <Input
                type="number"
                value={constraints.teacherBreakGap}
                onChange={(e) =>
                  setConstraints({
                    ...constraints,
                    teacherBreakGap: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="avoid-consecutive"
              checked={constraints.avoidConsecutiveSameSubject}
              onCheckedChange={(checked) =>
                setConstraints({
                  ...constraints,
                  avoidConsecutiveSameSubject: checked,
                })
              }
            />
            <Label htmlFor="avoid-consecutive" className="cursor-pointer">
              Avoid consecutive same subject
            </Label>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 5: Generate Timetable
  function Step5Generate() {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Step 5: Generate Timetable
          </CardTitle>
          <CardDescription>
            Review your settings and generate the timetable
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Selected Classes:</h3>
            <ul className="list-disc list-inside">
              {selectedClasses.map((classId) => {
                const className = classes.find((c) => c.id === classId)?.name;
                return <li key={classId}>{className}</li>;
              })}
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Settings:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Consider existing schedules: {considerExisting ? "Yes" : "No"}
              </li>
              <li>
                Working days:{" "}
                {
                  Object.keys(dayConfigs).filter((d) => dayConfigs[d].enabled)
                    .length
                }
              </li>
              <li>
                Max classes per day: {constraints.maxClassesPerDayPerClass}
              </li>
            </ul>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || selectedClasses.length === 0}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Generate Timetable
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Step 6: Preview and Edit
  function Step6Preview() {
    const [editingSlot, setEditingSlot] = useState(null);
    const [timetableNames, setTimetableNames] = useState({});

    const updateSlot = (groupId, slotIndex, field, value) => {
      const newTimetables = { ...generatedTimetables };
      if (newTimetables[groupId]) {
        newTimetables[groupId][slotIndex][field] = value;
        setGeneratedTimetables(newTimetables);
      }
    };

    return (
      <div className="space-y-6">
        {selectedClasses.map((classId) => {
          const className = classes.find((c) => c.id === classId)?.name;
          const slots = generatedTimetables[classId] || [];
          const classViolations = violations[classId] || {
            warnings: [],
            errors: [],
          };

          // Group slots by day
          const slotsByDay = {};
          slots.forEach((slot) => {
            if (!slotsByDay[slot.day]) {
              slotsByDay[slot.day] = [];
            }
            slotsByDay[slot.day].push(slot);
          });

          return (
            <Card key={classId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{className} - Timetable</CardTitle>
                    <CardDescription>
                      Review and edit the generated timetable
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Timetable name"
                      value={timetableNames[classId] || ""}
                      onChange={(e) =>
                        setTimetableNames({
                          ...timetableNames,
                          [classId]: e.target.value,
                        })
                      }
                      className="w-48"
                    />
                    <Button
                      onClick={() =>
                        handleSave(classId, timetableNames[classId])
                      }
                      disabled={loading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {classViolations.errors.length > 0 && (
                  <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-md">
                    <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Errors
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {classViolations.errors.map((error, index) => (
                        <li key={index} className="text-sm">
                          {error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {classViolations.warnings.length > 0 && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Warnings
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {classViolations.warnings.map((warning, index) => (
                        <li key={index} className="text-sm text-yellow-700">
                          {warning.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2">Time</th>
                        {DAYS.filter((d) => dayConfigs[d]?.enabled).map(
                          (day) => (
                            <th key={day} className="border p-2">
                              {day}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Get all unique time slots across all days
                        const timeSlots = new Set();
                        slots.forEach((slot) => {
                          if (!slot.isBreak) {
                            timeSlots.add(`${slot.startTime}-${slot.endTime}`);
                          }
                        });
                        const sortedTimeSlots = Array.from(timeSlots).sort();

                        return sortedTimeSlots.map((timeSlot) => {
                          const [startTime, endTime] = timeSlot.split("-");
                          return (
                            <tr key={timeSlot}>
                              <td className="border p-2 font-semibold">
                                {startTime} - {endTime}
                              </td>
                              {DAYS.filter((d) => dayConfigs[d]?.enabled).map(
                                (day) => {
                                  const daySlot = slots.find(
                                    (s) =>
                                      s.day === day &&
                                      s.startTime === startTime &&
                                      s.endTime === endTime
                                  );
                                  if (daySlot) {
                                    if (daySlot.isBreak) {
                                      return (
                                        <td
                                          key={day}
                                          className="border p-2 bg-gray-100"
                                        >
                                          {daySlot.breakName || "Break"}
                                        </td>
                                      );
                                    }
                                    const subject = subjects.find(
                                      (s) => s.id === daySlot.subjectId
                                    );
                                    const teacher = teachers.find(
                                      (t) => t.id === daySlot.teacherId
                                    );
                                    return (
                                      <td
                                        key={day}
                                        className="border p-2 cursor-pointer hover:bg-gray-50"
                                        onClick={() =>
                                          setEditingSlot({
                                            classId,
                                            slot: daySlot,
                                            index: slots.indexOf(daySlot),
                                          })
                                        }
                                      >
                                        {subject?.name || "N/A"} (
                                        {teacher?.full_name || "N/A"})
                                      </td>
                                    );
                                  }
                                  return (
                                    <td key={day} className="border p-2"></td>
                                  );
                                }
                              )}
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {editingSlot && (
          <Card>
            <CardHeader>
              <CardTitle>Edit Slot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select
                    value={editingSlot.slot.subjectId}
                    onValueChange={(value) =>
                      updateSlot(
                        editingSlot.classId,
                        editingSlot.index,
                        "subjectId",
                        value
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                  <Label>Teacher</Label>
                  <Select
                    value={editingSlot.slot.teacherId}
                    onValueChange={(value) =>
                      updateSlot(
                        editingSlot.classId,
                        editingSlot.index,
                        "teacherId",
                        value
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Room</Label>
                  <Select
                    value={editingSlot.slot.roomId || ""}
                    onValueChange={(value) =>
                      updateSlot(
                        editingSlot.classId,
                        editingSlot.index,
                        "roomId",
                        value
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingSlot(null)}>
                  Cancel
                </Button>
                <Button onClick={() => setEditingSlot(null)}>Save</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-destructive">{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setError("")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-600">{success}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSuccess("")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timetable Generator</h1>
          <p className="text-muted-foreground">Step {currentStep} of 6</p>
        </div>
        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevious}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
          {currentStep < 5 && (
            <Button
              onClick={handleNext}
              disabled={selectedClasses.length === 0}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {renderStep()}
    </div>
  );
}
