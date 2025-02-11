import { doc, getDoc, setDoc } from "firebase/firestore";
import {
    getFirebaseTimestamp,
    projectLastModified,
    Timestamp
} from "@config/firestore";
import { UPDATE_PROJECT_LAST_MODIFIED_LOCALLY } from "./types";

export const updateProjectLastModified = async (
    projectUid: string
): Promise<void> => {
    setDoc(
        doc(projectLastModified, projectUid),
        { timestamp: getFirebaseTimestamp() },
        { merge: true }
    );
};

export const updateProjectLastModifiedLocally = (
    projectUid: string,
    timestamp: Timestamp
): Record<string, any> => ({
    type: UPDATE_PROJECT_LAST_MODIFIED_LOCALLY,
    projectUid,
    timestamp
});

export const getProjectLastModifiedOnce = (
    projectUid: string
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch) => {
        const timestampReference = await getDoc(
            doc(projectLastModified, projectUid)
        );
        const timestampData = timestampReference.data() as any;
        const timestamp = timestampData && timestampData.timestamp;
        return await dispatch(
            updateProjectLastModifiedLocally(projectUid, timestamp)
        );
    };
};
