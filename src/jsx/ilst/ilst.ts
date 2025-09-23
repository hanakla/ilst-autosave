let isInSaving = false;

export const saveDocument = ({
  noConfirm,
}: {
  noConfirm: boolean;
}):
  | { ok: true; message: string }
  | { ok: false; userCancelled?: boolean; error: string } => {
  try {
    // Check if document is open
    if (!app.documents.length) {
      return { ok: true, message: "No document open" };
    }

    const doc = app.activeDocument;

    if (isInSaving) {
      return { ok: false, error: "Save in progress" };
    }

    // Check if document has changes
    if (!doc.saved) {
      if (!noConfirm && !confirm("Continue to auto-save the document?")) {
        return {
          ok: false,
          userCancelled: true,
          error: "User cancelled the save operation",
        };
      }

      doc.save();
      return { ok: true, message: "Document saved successfully" };
    } else {
      return { ok: true, message: "No changes to save" };
    }
  } catch (error) {
    isInSaving = false;

    const errorMessage =
      error instanceof Error ? (error as any).message : String(error);

    return { ok: false, error: errorMessage };
  }
};

export const getDocumentInfo = () => {
  if (!app.documents.length) {
    return { exists: false, name: "", saved: true };
  }

  const doc = app.activeDocument;
  return {
    exists: true,
    name: doc.name,
    saved: doc.saved,
  };
};
