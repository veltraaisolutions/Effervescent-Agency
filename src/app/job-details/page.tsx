"use client";

import { useState } from "react";
import {
  Smartphone,
  PlayCircle,
  Award,
  Shirt,
  AlertTriangle,
  ExternalLink,
  Upload,
  Loader2,
  CheckCircle,
} from "lucide-react";

const B = "#FDB8D7";

export default function JobDetailsPage() {
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !file) {
      alert("Please provide both your email and the certificate file.");
      return;
    }

    setStatus("uploading");

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("certificate", file);

      const response = await fetch(
        "https://n8n.veltraai.net/webhook/certificate-uploaded-on-job-details-page",
        {
          method: "POST",
          body: formData,
        },
      );

      if (response.ok) {
        setStatus("success");
        alert("Submitted successfully!");
        setEmail("");
        setFile(null);
      } else {
        throw new Error("Failed to upload");
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
      alert(
        "There was an error submitting your certificate. Please try again.",
      );
    } finally {
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10">
          <h1
            className="text-3xl font-black mb-2 italic"
            style={{ color: B }}
          >
            WELCOME TO EFFERVESCENT 💃
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Thank you for completing your onboarding form and availability
            submission. We’ve now sent you the next steps so you can begin
            preparing to work with us as a self-employed contractor.
          </p>
        </header>

        <div className="space-y-8">
          {/* 1. RotaCloud */}
          <section className="bg-[#111111] border border-[#1f1f1f] rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Smartphone
                className="w-5 h-5"
                style={{ color: B }}
              />
              <h2 className="font-bold text-lg">1. RotaCloud</h2>
            </div>
            <div className="text-gray-400 text-sm space-y-3">
              <p>
                You should now have received an email invitation to join
                RotaCloud. Please accept this as soon as possible — this is
                where you will view and accept shifts.
              </p>
              <div className="bg-white/5 p-4 rounded-xl space-y-2 border border-white/5">
                <p className="text-white font-medium">Once logged in:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Download the RotaCloud app</li>
                  <li>Upload a clear profile photo of yourself</li>
                </ul>
              </div>
              <p className="text-xs italic">
                If you cannot find the invitation email, please check your
                junk/spam folder.
              </p>
            </div>
          </section>

          {/* 2. Training */}
          <section className="bg-[#111111] border border-[#1f1f1f] rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <PlayCircle
                className="w-5 h-5"
                style={{ color: B }}
              />
              <h2 className="font-bold text-lg">2. Training Videos</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Please watch all training videos before your first shift. These
              explain how shifts work, sales techniques, venue expectations and
              equipment setup.
            </p>
            <a
              href="https://drive.google.com/drive/folders/1Pzvi1CYl7_o0X6xNHkZ9_k7bLO_3Rvz8?usp=sharing"
              className="flex items-center justify-between p-4 bg-[#FDB8D7]/10 rounded-2xl group border border-[#FDB8D7]/20"
            >
              <span
                className="font-bold"
                style={{ color: B }}
              >
                Access Training Vault
              </span>
              <ExternalLink
                className="w-4 h-4"
                style={{ color: B }}
              />
            </a>
          </section>

          {/* 3. Challenge 25 */}
          <section className="bg-[#111111] border border-[#1f1f1f] rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Award
                className="w-5 h-5"
                style={{ color: B }}
              />
              <h2 className="font-bold text-lg">
                3. Challenge 25 Training (Mandatory)
              </h2>
            </div>
            <div className="text-gray-400 text-sm space-y-4">
              <p>
                This is mandatory to work in nightlife environments. Please
                complete the course within 1 week, or before your first shift if
                sooner.
              </p>
              <div className="space-y-2">
                <a
                  href="https://lccexternal.astute-elearning.com/Content/LXP/LXPLogin.aspx?ReturnUrl=%2f"
                  className="block p-3 bg-white/5 rounded-xl text-center font-bold border border-white/10"
                >
                  Start E-Learning
                </a>
                <a
                  href="https://drive.google.com/file/d/1PHQkrDCJIekD1BvyGpNsfY_sqU9NgnkE/view?usp=sharing"
                  className="block text-center text-xs underline"
                >
                  Watch: How to enrol (Demo Video)
                </a>
              </div>

              {/* Upload Certificate Form */}
              <form
                onSubmit={handleUpload}
                className="mt-6 p-5 bg-[#0d0d0d] border border-dashed border-[#2a2a2a] rounded-2xl space-y-4"
              >
                <p className="text-white font-bold text-xs uppercase tracking-wider">
                  Upload Certificate
                </p>

                <input
                  type="email"
                  placeholder="Your Email Address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#161616] border border-[#2a2a2a] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#FDB8D7]/50 transition-colors"
                />

                <div className="relative">
                  <input
                    type="file"
                    id="cert-upload"
                    required
                    accept=".pdf,image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label
                    htmlFor="cert-upload"
                    className="flex items-center justify-center gap-2 w-full p-3 bg-white/5 border border-[#2a2a2a] rounded-xl cursor-pointer hover:bg-white/10 transition-all text-xs font-medium"
                  >
                    {file ? (
                      <span className="text-white truncate">{file.name}</span>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Select Certificate (PDF/Image)</span>
                      </>
                    )}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={status === "uploading"}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{ backgroundColor: B, color: "#000" }}
                >
                  {status === "uploading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : status === "success" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : null}
                  {status === "uploading"
                    ? "Uploading..."
                    : "Submit Certificate"}
                </button>
              </form>

              <p className="text-center text-xs font-medium">
                Alternatively, email certificate to:{" "}
                <span style={{ color: B }}>hello@effervescent.agency</span>
              </p>
            </div>
          </section>

          {/* Dress Code */}
          <section className="bg-[#111111] border border-[#1f1f1f] rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shirt
                className="w-5 h-5"
                style={{ color: B }}
              />
              <h2 className="font-bold text-lg">Dress Code</h2>
            </div>
            <div className="text-gray-400 text-sm space-y-3">
              <p>
                Standard dress code is{" "}
                <span className="text-white font-bold underline">
                  ALL BLACK
                </span>{" "}
                unless otherwise stated. We expect everyone representing
                Effervescent to take pride in their appearance.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] uppercase font-bold tracking-widest text-red-400">
                <div className="bg-red-400/5 p-2 rounded border border-red-400/10">
                  No Tracksuits
                </div>
                <div className="bg-red-400/5 p-2 rounded border border-red-400/10">
                  No Gymwear
                </div>
                <div className="bg-red-400/5 p-2 rounded border border-red-400/10">
                  No Jeans
                </div>
                <div className="bg-red-400/5 p-2 rounded border border-red-400/10">
                  No Trainers*
                </div>
              </div>
              <p className="text-[10px]">
                *Except black Converse-style trainers.
              </p>
            </div>
          </section>

          {/* Ground Rules */}
          <section className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="font-bold text-lg uppercase tracking-tight">
                Important Ground Rules
              </h2>
            </div>
            <div className="text-xs text-gray-500 space-y-4">
              <div className="space-y-2">
                <p className="text-white font-bold uppercase">
                  No drinking or drug use
                </p>
                <p>
                  This results in immediate termination of the contractor
                  relationship.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-white font-bold">Sickness & Cancellations</p>
                <p>
                  Report sickness before 10am. Two cancellations in 3 months may
                  result in suspension.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-white font-bold">Shift Allocation</p>
                <p>
                  Based on performance, reliability, and venue feedback. Busiest
                  shifts go to those who arrive prepared.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
