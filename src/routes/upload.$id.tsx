import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  ShieldAlert,
  RotateCcw,
  Check,
  AlertCircle,
  FlipHorizontal,
  Zap,
  ZapOff,
  CheckCircle2,
  Store,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Camera } from "react-camera-pro";
import { toast } from "sonner";

export const Route = createFileRoute("/upload/$id")({
  component: () => {
    const { id } = Route.useParams();
    const enterClaimablePrize = useMutation(api.prizes.enterClaimablePrize);
    const getUploadUrl = useMutation(api.storage.get_upload_url);
    const getFileUrl = useMutation(api.storage.get_Object_url);
    const [codeId, setCodeId] = useState<Id<"verified_codes">>();
    const decrypt = useAction(api.node.decrypt);
    const isVerified = useQuery(api.codes.verifyPrize, { id: codeId });
    const hasClaimed = useQuery(api.prizes.hasClaimed, { id: codeId });
    useEffect(() => {
      (async () => {
        const decryptedId = await decrypt({
          payload: id,
        });
        if (decryptedId) {
          setCodeId(decryptedId as Id<"verified_codes">);
        }
      })();
    }, [id]);
    const handlePhotoSubmit = async (photo: File) => {
      if (!codeId) return;
      const uploadUrl = await getUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": photo.type },
        body: photo,
      });
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      const { storageId } = await response.json();
      const fileUrl = await getFileUrl({
        id: storageId,
      });

      if (!storageId || !fileUrl) {
        toast.error("Error while uploading photo");
      } else {
        const res = await enterClaimablePrize({
          verified_code_id: codeId,
          storageId,
          cnic_image_url: fileUrl,
        });
        if (res === "code not found") {
          toast.error("Invalid Submission");
          return;
        }
        if (res === "already Claimed") {
          toast.error("The Photo has already been submitted");
          return;
        }
      }
    };

    if (!codeId) return null;
    if (hasClaimed) {
      return (
        <div className="w-full h-screen grid grid-cols-1 place-items-center bg-gray-50">
          <div className="max-w-lg w-full p-6 flex flex-col space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <AlertTitle className="text-green-800 text-lg font-semibold">
                CNIC Already Submitted
              </AlertTitle>
              <AlertDescription className="text-green-700 mt-2">
                <p className="mb-4">
                  You have successfully submitted your CNIC photo. Your
                  submission has been received and verified.
                </p>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Store className="size-5" />
                  <span>
                    You can now claim your prize by visiting the shop.
                  </span>
                </div>
              </AlertDescription>
            </Alert>
            <Link to="/">
              <Button className="w-full">Go Back</Button>
            </Link>
          </div>
        </div>
      );
    }
    if (typeof isVerified === "undefined" && codeId)
      return (
        <div className="flex h-screen w-full justify-center items-center">
          <Spinner className="size-12" />
        </div>
      );
    if (!isVerified) {
      return (
        <Empty>
          <EmptyMedia>
            <ShieldAlert />
          </EmptyMedia>
          <EmptyContent>
            <EmptyHeader>
              <EmptyTitle>UnAuthorized</EmptyTitle>
              <EmptyDescription>
                please make sure to verify you're code before comming to this
                page
              </EmptyDescription>
            </EmptyHeader>
          </EmptyContent>
        </Empty>
      );
    } else {
      return <CameraModule onPhotoSubmit={handlePhotoSubmit} />;
    }
  },
});

interface CameraModuleProps {
  onPhotoSubmit?: (photo: File) => Promise<void>;
}

interface CameraRef {
  takePhoto: () => string;
  switchCamera: () => void;
  toggleTorch?: () => void;
  flashStatus?: () => boolean;
}

function CameraModule({ onPhotoSubmit }: CameraModuleProps) {
  const camera = useRef<CameraRef | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [numberOfCameras, setNumberOfCameras] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTakePhoto = () => {
    if (camera.current) {
      const base64String = camera.current.takePhoto();
      setImage(base64String);
      const base64Data = base64String.split(",")[1];
      const mimeString = base64String.split(",")[0].split(":")[1].split(";")[0];
      const byteString = atob(base64Data);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const file = new File([blob], `cnic-photo-${Date.now()}.jpg`, {
        type: mimeString,
      });

      setCapturedFile(file);
    }
  };

  const handleSwitchCamera = () => {
    if (camera.current && numberOfCameras > 1) {
      camera.current.switchCamera();
      setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
      checkFlashAvailability();
    }
  };

  const checkFlashAvailability = () => {
    if (camera.current && camera.current.flashStatus) {
      try {
        const flashAvailable = camera.current.flashStatus();
        setHasFlash(flashAvailable !== undefined && flashAvailable !== null);
      } catch (error) {
        setHasFlash(false);
      }
    } else {
      setHasFlash(false);
    }
  };

  const handleToggleFlash = () => {
    if (camera.current && camera.current.toggleTorch) {
      try {
        camera.current.toggleTorch();
        setIsFlashOn((prev) => !prev);
      } catch (error) {
        console.error("Flash toggle failed:", error);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkFlashAvailability();
    }, 500);
    return () => clearTimeout(timer);
  }, [facingMode, numberOfCameras]);

  const handleSubmit = async () => {
    if (capturedFile && onPhotoSubmit) {
      setIsSubmitting(true);
      try {
        await onPhotoSubmit(capturedFile);
        toast.success("Photo Submitted Successfully");
      } catch (err) {
        toast.error("Error while submitting photo");
        console.error("Submission error:", err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      toast.error("No photo captured");
    }
  };

  const handleRetake = () => {
    setImage(null);
    setCapturedFile(null);
  };

  return (
    <div className="w-full h-screen grid grid-cols-1 place-items-center">
      <div className="h-screen max-w-lg w-full flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 z-20 p-4">
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800 text-sm font-semibold">
              Important Instructions
            </AlertTitle>
            <AlertDescription className="text-yellow-700 text-xs">
              Please ensure you have proper lighting and the image is clear.
              Otherwise, the prize will not be considered.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex-1 flex items-center justify-center relative">
          {!image ? (
            <div className="w-full h-full relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="relative"
                  style={{
                    aspectRatio: "85.6 / 53.98",
                    maxWidth: "90%",
                    maxHeight: "70%",
                    width: "100%",
                  }}
                >
                  {/* Camera with CNIC aspect ratio */}
                  <div className="absolute inset-0 overflow-hidden rounded-lg">
                    <Camera
                      ref={camera}
                      facingMode={facingMode}
                      numberOfCamerasCallback={setNumberOfCameras}
                      aspectRatio={85.6 / 53.98}
                      errorMessages={{
                        noCameraAccessible:
                          "Cannot Access the camera make sure the camera is enabled",
                        permissionDenied:
                          "Please provide Permission to use the Camera",
                        switchCamera: "Cannot Switch Camera",
                        canvas: "Canvas Error",
                      }}
                    />
                  </div>

                  {/* CNIC Card Frame Overlay */}
                  <div className="absolute inset-0 border-4 border-white rounded-lg shadow-2xl pointer-events-none">
                    <div className="absolute top-2 left-2 right-2 text-white text-xs font-semibold bg-black/50 px-2 py-1 rounded">
                      CNIC Card Frame
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4">
              <div
                className="relative rounded-lg overflow-hidden shadow-2xl border-4 border-white"
                style={{
                  aspectRatio: "85.6 / 53.98",
                  maxWidth: "90%",
                  maxHeight: "70%",
                  width: "100%",
                }}
              >
                <img
                  src={image}
                  alt="Captured CNIC"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-8 pt-16">
          <div className="relative flex items-center justify-center px-4">
            {!image ? (
              <>
                {/* Switch Camera Button - Positioned absolutely on the left */}
                {numberOfCameras > 1 && (
                  <Button
                    onClick={handleSwitchCamera}
                    variant="outline"
                    size="icon-lg"
                    className="absolute left-4 rounded-full bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                    aria-label="Switch camera"
                  >
                    <FlipHorizontal className="size-6" />
                  </Button>
                )}

                {/* Flash Button - Positioned absolutely on the right */}
                {hasFlash && (
                  <Button
                    onClick={handleToggleFlash}
                    variant="outline"
                    size="icon-lg"
                    className="absolute right-4 rounded-full bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                    aria-label="Toggle flash"
                  >
                    {isFlashOn ? (
                      <Zap className="size-6 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <ZapOff className="size-6" />
                    )}
                  </Button>
                )}

                {/* Capture Button - Always centered */}
                <Button
                  onClick={handleTakePhoto}
                  size="icon-lg"
                  className="rounded-full bg-white w-20 h-20 border-4 border-gray-300 shadow-lg hover:bg-gray-100 active:scale-95 transition-transform"
                >
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-400" />
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                {/* Retake Button */}
                <Button
                  onClick={handleRetake}
                  variant="outline"
                  size="lg"
                  className="rounded-full bg-gray-700/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 px-8"
                >
                  <RotateCcw className="size-5 mr-2" />
                  Retake
                </Button>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  size="lg"
                  disabled={isSubmitting || !capturedFile}
                  className="rounded-full bg-green-600 hover:bg-green-700 text-white px-8 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="size-5 mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="size-5 mr-2" />
                      Submit
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
