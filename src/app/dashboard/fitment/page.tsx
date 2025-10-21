/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Beneficiary {
  id: string;
  reg_number: string;
  name: string;
  type_of_aid: string;
  current_step: string;
  measurement_data?: any;
  fitment_data?: any;
}

export default function FitmentPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [currentEvent, setCurrentEvent] = useState<any>(null);

  useEffect(() => {
    const eventId = localStorage.getItem("current_event");
    if (!eventId) {
      alert("Please select an event first");
      window.location.href = "/event-setup";
      return;
    }
    fetchEvent(eventId);
    fetchBeneficiaries(eventId);
  }, []);

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
    }
  };

  const fetchBeneficiaries = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from("beneficiaries")
        .select("*")
        .eq("event_id", eventId)
        .eq("current_step", "fitment")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setBeneficiaries(data || []);
    } catch (error: any) {
      console.error("Error:", error);
      alert("Error loading beneficiaries: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const markFitmentDone = async (beneficiaryId: string) => {
    setUpdating(beneficiaryId);
    try {
      const { error } = await supabase
        .from("beneficiaries")
        .update({
          current_step: "extra_items",
          fitment_data: {
            status: "completed",
            completed_at: new Date().toISOString(),
          },
        })
        .eq("id", beneficiaryId);

      if (error) throw error;

      // Remove from local list
      setBeneficiaries((prev) => prev.filter((b) => b.id !== beneficiaryId));
      alert("Fitment marked as completed! Moved to Step 5: Extra Items");
    } catch (error: any) {
      console.error("Error:", error);
      alert("Error updating fitment: " + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const revertToPreviousStep = async (beneficiaryId: string) => {
    if (
      !confirm(
        "Are you sure you want to send this beneficiary back to Measurement step?"
      )
    ) {
      return;
    }

    setUpdating(beneficiaryId);
    try {
      const { error } = await supabase
        .from("beneficiaries")
        .update({
          current_step: "measurement",
          fitment_data: null,
        })
        .eq("id", beneficiaryId);

      if (error) throw error;

      // Remove from local list
      setBeneficiaries((prev) => prev.filter((b) => b.id !== beneficiaryId));
      alert("Beneficiary sent back to Measurement step");
    } catch (error: any) {
      console.error("Error:", error);
      alert("Error reverting step: " + error.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading)
    return <div className="text-center py-8 text-black">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-lg mr-4">
            4
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fitment</h1>
            <p className="text-gray-600">Step 4: Mark fitment as completed</p>
            {currentEvent && (
              <p className="text-sm text-gray-500 mt-1">
                Event: {currentEvent.event_name} |{" "}
                {new Date(currentEvent.event_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {beneficiaries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No beneficiaries waiting for fitment.
          </div>
        ) : (
          <div className="space-y-4">
            {beneficiaries.map((beneficiary) => (
              <div
                key={beneficiary.id}
                className="border border-gray-200 rounded-lg p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {beneficiary.name}
                    </h3>
                    <p className="text-gray-600">
                      Reg: {beneficiary.reg_number}
                    </p>
                    <p className="text-sm text-gray-500">
                      Aid: {beneficiary.type_of_aid}
                    </p>

                    {/* Measurement Status */}
                    {beneficiary.measurement_data && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          ✅ Measurements Completed
                        </span>
                      </div>
                    )}

                    <div className="mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        🦿 Waiting for Fitment
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fitment Status */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">
                    Fitment Status:
                  </h4>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                    <span className="text-gray-700">
                      Pending - Artificial limb needs to be fitted
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => markFitmentDone(beneficiary.id)}
                    disabled={updating === beneficiary.id}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                  >
                    {updating === beneficiary.id ? (
                      <>⏳ Processing...</>
                    ) : (
                      <>✅ Mark Fitment Completed</>
                    )}
                  </button>

                  <button
                    onClick={() => revertToPreviousStep(beneficiary.id)}
                    disabled={updating === beneficiary.id}
                    className="px-4 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                    title="Send back to Measurement step"
                  >
                    ↩️
                  </button>
                </div>

                {/* Instructions */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Instructions:</strong> Fit the artificial limb to
                    the beneficiary, ensure proper comfort and functionality,
                    then click &quot;Mark Fitment Completed&quot; to move to
                    next step.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-900">Fitment Progress</h3>
              <p className="text-green-700 text-sm">
                {beneficiaries.length}{" "}
                {beneficiaries.length === 1 ? "person" : "people"} waiting for
                fitment
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {beneficiaries.length}
              </div>
              <div className="text-sm text-green-800">Pending</div>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button className="bg-green-600 text-sm text-white px-8 py-3 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium w-full ">
            <Link href="/dashboard/extra-items">Move to Extra Items</Link>
          </button>
        </div>
      </div>
    </div>
  );
}
