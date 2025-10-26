/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { beneficiarySchema } from "@/lib/validations";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

type BeneficiaryFormInputs = z.infer<typeof beneficiarySchema>;

export default function RegistrationPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showOtherAidInput, setShowOtherAidInput] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<BeneficiaryFormInputs>({
    // cast resolver to any to avoid type incompatibility between @hookform and zod types
    resolver: zodResolver(beneficiarySchema) as any,
    defaultValues: {
      type_of_aid: {
        stick_qty: 1,
        crutches_qty: 1,
        elbow_crutches_qty: 1,
      },
    },
  });

  const dob = watch("date_of_birth");
  const watchTypeOfAid = watch("type_of_aid");

  useEffect(() => {
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setValue("age", age >= 0 ? age : 0, { shouldValidate: true });
    } else {
      setValue("age", undefined);
    }
  }, [dob, setValue]);

  useEffect(() => {
    setShowOtherAidInput(!!watchTypeOfAid?.others);
    if (!watchTypeOfAid?.others) {
      setValue("type_of_aid.others_specify", "");
    }
  }, [watchTypeOfAid, setValue]);

  useEffect(() => {
    const eventId = localStorage.getItem("current_event");
    if (!eventId) {
      alert("Please select an event first");
      router.push("/event-setup");
      return;
    }
    fetchEvent(eventId);
  }, [router]);

  // when currentEvent loads, set camp_date in the form values
  useEffect(() => {
    if (currentEvent?.event_date) {
      setValue("camp_date", currentEvent.event_date);
    }
  }, [currentEvent, setValue]);

  const fetchEvent = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) throw error;
      setCurrentEvent(data);
    } catch (error: any) {
      console.error("Error:", error);
      alert("Error loading event: " + error.message);
    }
  };

  const formatTypeOfAid = (data: any) => {
    if (!data) return "Not specified";
    const aidParts = [];
    if (data.left_below_knee) aidParts.push("Left Below Knee");
    if (data.left_above_knee) aidParts.push("Left Above Knee");
    if (data.right_below_knee) aidParts.push("Right Below Knee");
    if (data.right_above_knee) aidParts.push("Right Above Knee");
    if (data.left_caliper) aidParts.push("Left Caliper");
    if (data.right_caliper) aidParts.push("Right Caliper");
    if (data.above_hand) aidParts.push("Above Hand");
    if (data.below_hand) aidParts.push("Below Hand");
    if (data.shoes) aidParts.push("Shoes");
    if (data.gloves) aidParts.push("Gloves");
    if (data.walker) aidParts.push("Walker");
    if (data.stick) aidParts.push(`Stick (Qty: ${data.stick_qty || 1})`);
    if (data.crutches)
      aidParts.push(`Crutches (Qty: ${data.crutches_qty || 1})`);
    if (data.elbow_crutches)
      aidParts.push(`Elbow Crutches (Qty: ${data.elbow_crutches_qty || 1})`);
    if (data.others && data.others_specify)
      aidParts.push(`Other: ${data.others_specify}`);

    return aidParts.join(", ") || "Not specified";
  };

  const onSubmit: SubmitHandler<BeneficiaryFormInputs> = async (data) => {
    const eventId = localStorage.getItem("current_event");
    if (!eventId) {
      alert("Please select an event first");
      router.push("/event-setup");
      return;
    }

    setUploading(true);
    setFormError(null);
    try {
      // Generate sequential registration number
      // Use a select that returns count in a compatible way across supabase-js versions
      const countRes = await supabase
        .from("beneficiaries")
        .select("id", { count: "exact" })
        .eq("event_id", eventId);

      if (countRes.error) throw countRes.error;
      const existingCount =
        typeof countRes.count === "number"
          ? countRes.count
          : Array.isArray(countRes.data)
          ? countRes.data.length
          : 0;
      const nextNumber = (existingCount + 1).toString().padStart(4, "0");
      const regNumber = `REG-${nextNumber}`;

      // Format type_of_aid for display
      const formattedAid = formatTypeOfAid(data.type_of_aid);

      // keep others_specify as its own field (schema expects boolean 'others' and string 'others_specify')
      const finalData = { ...data };

      const insertPayload = {
        ...finalData,
        reg_number: regNumber,
        event_id: eventId,
        camp_date: currentEvent?.event_date ?? null,
        current_step: "before_photo",
        completed_steps: ["registration"],
        type_of_aid: finalData.type_of_aid, // Save the raw object
        type_of_aid_display: formattedAid, // Save formatted string in a new field for display
      };

      const insertRes = await supabase
        .from("beneficiaries")
        .insert([insertPayload])
        .select();
      if (insertRes.error) throw insertRes.error;

      alert(
        `Beneficiary registered successfully! Registration Number: ${regNumber}`
      );
      reset();
    } catch (error: any) {
      console.error("Registration error (full):", error);
      // Show a helpful message to user
      // Build a short message for logging/debug — we set formError below
      // --- Start of Error Handling Logic ---
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.message) {
        if (error.message.includes("value too long")) {
          errorMessage =
            "One or more fields have text that is too long. Please shorten your input for fields like Name or Address.";
        } else if (error.message.includes("violates not-null constraint")) {
          const columnName = error.message.match(/"(.*?)"/)?.[1];
          errorMessage = `The field '${columnName}' is required but was not provided. Please fill it out.`;
        } else if (
          error.message.includes(
            "duplicate key value violates unique constraint"
          )
        ) {
          errorMessage =
            "A beneficiary with this information already exists in the database.";
        } else {
          errorMessage = `Error: ${error.message}. Please check your inputs.`;
        }
      }
      setFormError(errorMessage);
      // --- End of Error Handling Logic ---
    } finally {
      setUploading(false);
    }
  };

  if (!currentEvent) {
    return (
      <div className="text-center py-8 text-black">
        Loading event details...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg mr-4">
            1
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Registration Desk
            </h1>
            <p className="text-gray-600">
              Step 1: Register new beneficiary details
            </p>
            <div className="mt-2 p-2 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                <strong>Event:</strong> {currentEvent.event_name} |
                <strong> Date:</strong>{" "}
                {new Date(currentEvent.event_date).toLocaleDateString()} |
                <strong> Location:</strong> {currentEvent.location}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                {...register("name", { required: "Name is required" })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Father&apos;s Name
              </label>
              <input
                type="text"
                {...register("father_name")}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="Enter father's name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                {...register("date_of_birth")}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                {...register("age")}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-gray-100"
                placeholder="Age (auto-calculated)"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                {...register("phone_number")}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aadhar Number
              </label>
              <input
                type="text"
                {...register("aadhar_number")}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="Enter Aadhar number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                {...register("state")}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="Enter state"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              {...register("address")}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              placeholder="Enter complete address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type of Aid *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">Lower Limb</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("type_of_aid.left_below_knee")}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">
                    Left Below Knee
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("type_of_aid.left_above_knee")}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">
                    Left Above Knee
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("type_of_aid.right_below_knee")}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">
                    Right Below Knee
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("type_of_aid.right_above_knee")}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">
                    Right Above Knee
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">Upper Limb</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("type_of_aid.left_caliper")}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">Left Caliper</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("type_of_aid.right_caliper")}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">Right Caliper</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("type_of_aid.above_hand")}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">Above Hand</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("type_of_aid.below_hand")}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">Below Hand</label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">Mobility Aids</h3>
                <div className="flex items-center space-x-2 ">
                  <input
                    type="checkbox"
                    {...register("type_of_aid.stick")}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">Stick</label>
                  {watchTypeOfAid?.stick && (
                    <input
                      type="number"
                      {...register("type_of_aid.stick_qty", {
                        valueAsNumber: true,
                      })}
                      className="w-16 p-1 text-gray-600 border border-gray-300 rounded text-sm"
                      min="1"
                      defaultValue={1}
                    />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("type_of_aid.crutches")}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">Crutches</label>
                  {watchTypeOfAid?.crutches && (
                    <input
                      type="number"
                      {...register("type_of_aid.crutches_qty", {
                        valueAsNumber: true,
                      })}
                      className="w-16 p-1 text-gray-600 border border-gray-300 rounded text-sm"
                      min="1"
                      defaultValue={1}
                    />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("type_of_aid.shoes")}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">Shoes</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("type_of_aid.walker")}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">Walker</label>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">Other Aids</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("type_of_aid.gloves")}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">Gloves</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("type_of_aid.elbow_crutches_qty")}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">
                    Elbow Crutches
                  </label>
                  <input
                    type="number"
                    {...register("type_of_aid.elbow_crutches_qty", {
                      valueAsNumber: true,
                    })}
                    className="w-16 p-1 text-gray-600 border border-gray-300 rounded text-sm"
                    min="0"
                    defaultValue={1}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("type_of_aid.others")}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">Others</label>
                </div>
                {showOtherAidInput && (
                  <div className="pl-6">
                    <input
                      type="text"
                      {...register("type_of_aid.others_specify")}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Please specify other aid"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- Start: Display Form Error --- */}
          {formError && (
            <div className="my-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
              <p className="font-medium">Registration Failed</p>
              <p className="text-sm">{formError}</p>
            </div>
          )}
          {/* --- End: Display Form Error --- */}

          <div className="flex w-full justify-end space-x-4">
            <button className="bg-green-600 text-sm text-white px-8 py-3 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium w-full ">
              <Link href="/dashboard/before-photo">Move to Before Photo</Link>
            </button>

            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {uploading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
