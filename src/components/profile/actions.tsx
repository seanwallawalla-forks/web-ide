import { ThunkAction } from "redux-thunk";
import { Action } from "redux";
import { IStore } from "@store/types";
import { getDownloadURL, uploadBytes } from "firebase/storage";
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    writeBatch
} from "firebase/firestore";
import {
    database,
    following,
    followers,
    fieldDelete,
    getFirebaseTimestamp,
    projects,
    profiles,
    profileStars,
    usernames,
    stars,
    tags,
    targets,
    Timestamp,
    storageReference
} from "@config/firestore";
import {
    ProjectsCount,
    IProfile,
    ProfileActionTypes,
    ADD_USER_PROJECT,
    DELETE_USER_PROJECT,
    STORE_USER_PROFILE,
    STORE_PROFILE_PROJECTS_COUNT,
    STORE_PROFILE_STARS,
    SET_CURRENT_TAG_TEXT,
    SET_TAGS_INPUT,
    GET_ALL_TAGS,
    SET_CURRENTLY_PLAYING_PROJECT,
    CLOSE_CURRENTLY_PLAYING_PROJECT,
    REFRESH_USER_PROFILE,
    SET_FOLLOWING_FILTER_STRING,
    SET_PROJECT_FILTER_STRING
} from "./types";
import { defaultCsd, defaultOrc, defaultSco } from "@root/templates";
import { openSnackbar } from "@comp/snackbar/actions";
import { SnackbarType } from "@comp/snackbar/types";
import { openSimpleModal } from "@comp/modal/actions";
import { ProjectModal } from "./project-modal";
import { getDeleteProjectModal } from "./delete-project-modal";
import { selectLoggedInUid } from "@comp/login/selectors";
import { selectCurrentlyPlayingProject } from "./selectors";
import {
    downloadAllProjectDocumentsOnce,
    downloadProjectOnce
} from "@comp/projects/actions";
import { getProjectLastModifiedOnce } from "@comp/project-last-modified/actions";
import { getPlayActionFromProject } from "@comp/target-controls/utils";
import { downloadTargetsOnce } from "@comp/target-controls/actions";
import { IProject } from "@comp/projects/types";
import { fetchCsound, newCsound } from "@comp/csound/actions";
import { ProfileModal } from "./profile-modal";
import {
    assoc,
    concat,
    difference,
    equals,
    keys,
    reject,
    path,
    pathOr,
    hasPath,
    reduce
} from "ramda";

const addUserProjectAction = (): ProfileActionTypes => {
    return {
        type: ADD_USER_PROJECT
    };
};

const handleProjectTags = async (projectUid, loggedInUserUid, currentTags) => {
    const currentProjTagsReference = await getDocs(
        query(tags, where(projectUid, "==", loggedInUserUid))
    );

    /* eslint-disable-next-line unicorn/prefer-object-from-entries */
    const currentProjTags = currentProjTagsReference.docs.reduce(
        (accumulator, document_) =>
            assoc(document_.id, document_.data(), accumulator),
        {}
    );
    const newTags = reject(
        (t) => keys(currentProjTags).includes(t),
        currentTags
    );
    const deletedTags = difference(
        keys(currentProjTags).sort(),
        currentTags.sort()
    );

    const batch = writeBatch(database);
    await Promise.all(
        newTags.map(async (newTag) => {
            batch.set(
                doc(tags, newTag),
                { [projectUid]: loggedInUserUid },
                { merge: true }
            );
        })
    );
    await Promise.all(
        deletedTags.map(async (delTag) => {
            const tagDoc = await getDoc(doc(tags, delTag));
            const tagData = tagDoc.data();
            if (
                tagData &&
                keys(tagData).length === 1 &&
                keys(tagData)[0] === projectUid
            ) {
                batch.delete(doc(tags, delTag));
            } else if (tagData && keys(tagData).length > 0) {
                batch.update(doc(tags, delTag), {
                    [projectUid]: fieldDelete()
                });
            }
        })
    );
    await batch.commit();
};

export const addUserProject =
    (
        name: string,
        description: string,
        currentTags: string[],
        projectUid: string,
        iconName: string,
        iconForegroundColor: string,
        iconBackgroundColor: string
    ): ThunkAction<void, any, null, Action<string>> =>
    async (dispatch, getState) => {
        const currentState = getState();
        const loggedInUserUid = selectLoggedInUid(currentState);
        if (loggedInUserUid) {
            const newProject = {
                userUid: loggedInUserUid,
                name,
                created: getFirebaseTimestamp(),
                description,
                public: true,
                iconName,
                iconForegroundColor,
                iconBackgroundColor
            };

            try {
                const batch = writeBatch(database);
                const newProjectReference = doc(projects);
                batch.set(newProjectReference, newProject);
                const filesReference = collection(newProjectReference, "files");
                const csdFileReference = doc(filesReference);
                batch.set(csdFileReference, {
                    ...defaultCsd,
                    userUid: loggedInUserUid
                });
                batch.set(doc(filesReference), {
                    ...defaultOrc,
                    userUid: loggedInUserUid
                });
                batch.set(doc(filesReference), {
                    ...defaultSco,
                    userUid: loggedInUserUid
                });
                batch.set(
                    doc(targets, newProjectReference.id),
                    {
                        targets: {
                            "project.csd": {
                                csoundOptions: {},
                                targetName: "project.csd",
                                targetType: "main",
                                targetDocumentUid: csdFileReference.id
                            }
                        },
                        defaultTarget: "project.csd"
                    },
                    { merge: true }
                );
                await batch.commit();
                await handleProjectTags(
                    newProjectReference.id,
                    loggedInUserUid,
                    currentTags
                );
                dispatch(addUserProjectAction());
                dispatch(openSnackbar("Project Added", SnackbarType.Success));
            } catch (error) {
                console.log(error);
                dispatch(
                    openSnackbar("Could not add Project", SnackbarType.Error)
                );
            }
        }
    };

export const editUserProject =
    (
        name: string,
        description: string,
        currentTags: string[],
        projectUid: string,
        iconName: string,
        iconForegroundColor: string,
        iconBackgroundColor: string
    ): ThunkAction<void, any, null, Action<string>> =>
    async (dispatch, getState) => {
        const currentState = getState();
        const loggedInUserUid = selectLoggedInUid(currentState);
        if (loggedInUserUid) {
            const newProject = {
                userUid: loggedInUserUid,
                name: name || "",
                description: description || "",
                public: false,
                iconName: iconName || "",
                iconForegroundColor: iconForegroundColor || "",
                iconBackgroundColor: iconBackgroundColor || ""
            };

            try {
                const newProjectReference = await doc(projects, projectUid);
                await updateDoc(newProjectReference, newProject);
                await handleProjectTags(
                    projectUid,
                    loggedInUserUid,
                    currentTags
                );
                dispatch(addUserProjectAction());
                dispatch(
                    openSnackbar("Project modified", SnackbarType.Success)
                );
            } catch (error) {
                console.log(error);
                dispatch(
                    openSnackbar("Could not edit Project", SnackbarType.Error)
                );
            }
        }
    };

const deleteUserProjectAction = (): ProfileActionTypes => {
    return {
        type: DELETE_USER_PROJECT
    };
};

export const deleteUserProject =
    (project: IProject): ThunkAction<void, any, null, Action<string>> =>
    async (dispatch, getState) => {
        const currentState = getState();
        const loggedInUserUid = selectLoggedInUid(currentState);
        if (loggedInUserUid) {
            const files = await getDocs(
                collection(doc(projects, project.projectUid), "files")
            );
            const batch = writeBatch(database);
            const documentReference = doc(projects, project.projectUid);
            batch.delete(documentReference);
            files.forEach((d) => batch.delete(d.ref));

            try {
                await batch.commit();
                setTimeout(() => dispatch(deleteUserProjectAction()), 1);

                dispatch(openSnackbar("Project Deleted", SnackbarType.Success));
            } catch {
                dispatch(
                    openSnackbar("Could Not Delete Project", SnackbarType.Error)
                );
            }
        }
    };

export const setCurrentTagText = (text: string): ProfileActionTypes => {
    return {
        type: SET_CURRENT_TAG_TEXT,
        payload: text
    };
};

export const setTagsInput = (tags: Array<any>): ProfileActionTypes => {
    return {
        type: SET_TAGS_INPUT,
        payload: tags
    };
};

export const getAllTagsFromUser =
    (
        loggedInUserUid: string | undefined,
        allUserProjectsUids: string[]
    ): ThunkAction<void, any, null, Action<string>> =>
    async (dispatch, getStore) => {
        const store = getStore();

        const currentAllTags = pathOr(
            {},
            ["ProfiledReducer", "profiles", loggedInUserUid, "allTags"],
            store
        );

        if (allUserProjectsUids) {
            const allTags = reduce(
                (accumulator, item) => concat(item.tags || [], accumulator),
                [],
                allUserProjectsUids
            );
            // console.log();
            if (!equals(currentAllTags, allTags)) {
                dispatch({ type: GET_ALL_TAGS, allTags, loggedInUserUid });
            }
        }
    };

export const addProject = () => {
    return async (dispatch: (any) => void): Promise<void> => {
        dispatch(
            openSimpleModal(ProjectModal, {
                name: "New Project",
                description: "",
                label: "Create Project",
                newProject: true,
                projectID: "",
                iconName: undefined,
                iconForegroundColor: undefined,
                iconBackgroundColor: undefined
            })
        );
    };
};

export const followUser =
    (
        loggedInUserUid: string,
        profileUid: string
    ): ThunkAction<void, any, null, Action<string>> =>
    async (dispatch) => {
        const batch = writeBatch(database);
        const followersReference = doc(followers, profileUid);
        const followersData = await getDoc(followersReference);

        if (followersData.exists()) {
            batch.update(followersReference, {
                [loggedInUserUid]: getFirebaseTimestamp()
            });
        } else {
            batch.set(followersReference, {
                [loggedInUserUid]: getFirebaseTimestamp()
            });
        }

        const followingReference = doc(following, loggedInUserUid);
        const followingData = await getDoc(followingReference);
        if (followingData.exists()) {
            batch.update(followingReference, {
                [profileUid]: getFirebaseTimestamp()
            });
        } else {
            batch.set(followingReference, {
                [profileUid]: getFirebaseTimestamp()
            });
        }

        await batch.commit();
    };

export const unfollowUser =
    (
        loggedInUserUid: string,
        profileUid: string
    ): ThunkAction<void, any, null, Action<string>> =>
    async (dispatch) => {
        const batch = writeBatch(database);
        batch.update(doc(followers, profileUid), {
            [loggedInUserUid]: fieldDelete()
        });
        batch.update(doc(following, loggedInUserUid), {
            [profileUid]: fieldDelete()
        });
        await batch.commit();
    };

export const updateUserProfile =
    (
        originalUsername: string,
        username: string,
        displayName: string,
        bio: string,
        link1: string,
        link2: string,
        link3: string,
        backgroundIndex: number
    ): ThunkAction<void, any, null, Action<string>> =>
    async (dispatch, getState) => {
        const currentState = getState();
        const loggedInUserUid = selectLoggedInUid(currentState);
        if (loggedInUserUid) {
            await updateDoc(doc(profiles, loggedInUserUid), {
                username,
                displayName,
                bio,
                link1,
                link2,
                link3,
                backgroundIndex
            });

            await deleteDoc(doc(usernames, originalUsername));
            await setDoc(doc(usernames, username), {
                userUid: loggedInUserUid
            });
            dispatch({
                type: REFRESH_USER_PROFILE,
                payload: { username, displayName, bio, link1, link2, link3 }
            });
        }
    };

export const editProfile = (
    username: string,
    displayName: string,
    bio: string,
    link1: string,
    link2: string,
    link3: string,
    backgroundIndex: number
): ((dispatch: (any) => void, getState: () => IStore) => Promise<void>) => {
    return async (dispatch, getState) => {
        const currentState = getState();
        const loggedInUserUid = selectLoggedInUid(currentState);
        if (loggedInUserUid) {
            const names = await getDocs(usernames);
            const existingNames: string[] = [];
            names.forEach((name) => {
                if (name.id !== username) {
                    existingNames.push(name.id);
                }
            });

            dispatch(
                openSimpleModal(ProfileModal, {
                    existingNames: existingNames,
                    username: username,
                    displayName: displayName,
                    bio: bio,
                    link1: link1,
                    link2: link2,
                    link3: link3,
                    backgroundIndex: backgroundIndex
                })
            );
        }
    };
};

export const editProject = (
    project: IProject
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch) => {
        dispatch(
            openSimpleModal(ProjectModal, {
                name: project.name,
                description: project.description,
                label: "Apply changes",
                projectID: project.projectUid,
                iconName: project.iconName,
                iconForegroundColor: project.iconForegroundColor,
                iconBackgroundColor: project.iconBackgroundColor,
                newProject: false
            })
        );
    };
};

export const deleteProject = (
    project: IProject
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch) => {
        const DeleteProjectModal = getDeleteProjectModal(project);
        dispatch(openSimpleModal(DeleteProjectModal, {}));
    };
};

export const uploadProfileImage =
    (
        loggedInUserUid: string,
        file: File
    ): ThunkAction<void, any, null, Action<string>> =>
    async (dispatch) => {
        try {
            const uploadStorage = await storageReference(
                `images/${loggedInUserUid}/profile.jpeg`
            );
            await uploadBytes(uploadStorage, file);

            const imageUrl = await getDownloadURL(uploadStorage);
            await updateDoc(doc(profiles, loggedInUserUid), {
                photoUrl: imageUrl
            });
            dispatch(
                openSnackbar("Profile Picture Uploaded", SnackbarType.Success)
            );
        } catch {
            dispatch(
                openSnackbar(
                    "Profile Picture Upload Failed",
                    SnackbarType.Error
                )
            );
        }
    };

export const playListItem =
    (
        projectUid: string | false
    ): ((dispatch: (any) => void, getState: () => IStore) => Promise<void>) =>
    async (dispatch, getState) => {
        const state = getState();
        let Csound = state.csound.factory;

        if (!Csound) {
            Csound = await fetchCsound(dispatch);
        }

        const currentlyPlayingProject = selectCurrentlyPlayingProject(state);

        if (projectUid === false) {
            console.log("playListItem: projectUid is false");
            return;
        }

        if (projectUid !== currentlyPlayingProject) {
            await dispatch({
                type: SET_CURRENTLY_PLAYING_PROJECT,
                projectUid: undefined
            });
        }

        const projectIsCached = hasPath(
            ["ProjectsReducer", "projects", projectUid],
            state
        );
        const projectHasLastModule = hasPath(
            ["ProjectLastModifiedReducer", projectUid, "timestamp"],
            state
        );
        let timestampMismatch = false;

        if (projectIsCached && projectHasLastModule) {
            const cachedTimestamp: Timestamp | undefined = path(
                [
                    "ProjectsReducer",
                    "projects",
                    projectUid,
                    "cachedProjectLastModified"
                ],
                state
            );
            const currentTimestamp: Timestamp | undefined = path(
                ["ProjectLastModifiedReducer", projectUid, "timestamp"],
                state
            );
            if (cachedTimestamp && currentTimestamp) {
                timestampMismatch =
                    (cachedTimestamp as Timestamp).toMillis() !==
                    (currentTimestamp as Timestamp).toMillis();
            }
        }

        if (!projectIsCached || timestampMismatch || !projectHasLastModule) {
            await downloadProjectOnce(projectUid)(dispatch);
            await downloadAllProjectDocumentsOnce(projectUid)(dispatch);
            await downloadTargetsOnce(projectUid)(dispatch);
            await getProjectLastModifiedOnce(projectUid)(dispatch);
            // recursion
            return await playListItem(projectUid)(dispatch, getState);
        }

        let csound = state.csound.csound;

        if (!csound) {
            csound = await newCsound(Csound, dispatch);
        } else {
            csound && (await csound.terminateInstance());
            csound = await newCsound(Csound, dispatch);
        }

        csound &&
            csound.on("realtimePerformanceEnded", () =>
                dispatch({ type: CLOSE_CURRENTLY_PLAYING_PROJECT })
            );
        const playAction = getPlayActionFromProject(projectUid, state);

        if (playAction) {
            playAction(dispatch, csound);
            await dispatch({
                type: SET_CURRENTLY_PLAYING_PROJECT,
                projectUid
            });
        } else {
            // handle unplayable project
        }
    };

export const storeProfileProjectsCount = (
    projectsCount: ProjectsCount,
    profileUid: string
): Record<string, any> => {
    return {
        type: STORE_PROFILE_PROJECTS_COUNT,
        projectsCount,
        profileUid
    };
};

export const storeUserProfile = (
    profile: IProfile,
    profileUid: string
): Record<string, any> => {
    return {
        type: STORE_USER_PROFILE,
        profile,
        profileUid
    };
};

export const storeProfileStars = (
    stars: Record<string, Timestamp>,
    profileUid: string
): Record<string, any> => {
    return {
        type: STORE_PROFILE_STARS,
        profileUid,
        stars
    };
};

export const setProjectFilterString = (payload: string): ProfileActionTypes => {
    return {
        type: SET_PROJECT_FILTER_STRING,
        payload
    };
};

export const setFollowingFilterString = (
    payload: string
): ProfileActionTypes => {
    return {
        type: SET_FOLLOWING_FILTER_STRING,
        payload
    };
};

export const starOrUnstarProject = (
    projectUid: string,
    loggedInUserUid: string
): ((dispatch: any) => Promise<void>) => {
    return async () => {
        if (!projectUid || !loggedInUserUid) {
            return;
        }
        const batch = writeBatch(database);
        const currentProjectStarsReference = await getDoc(
            doc(stars, projectUid)
        );
        const currentProjectStars = currentProjectStarsReference.exists()
            ? currentProjectStarsReference.data()
            : {};
        const currentlyStarred = keys(currentProjectStars || []).includes(
            loggedInUserUid
        );

        if (!currentlyStarred) {
            batch.set(
                doc(stars, projectUid),
                { [loggedInUserUid]: getFirebaseTimestamp() },
                { merge: true }
            );
            batch.set(
                doc(profileStars, loggedInUserUid),
                { [projectUid]: getFirebaseTimestamp() },
                { merge: true }
            );
        } else {
            batch.update(doc(stars, projectUid), {
                [loggedInUserUid]: fieldDelete()
            });
            batch.update(doc(profileStars, loggedInUserUid), {
                [projectUid]: fieldDelete()
            });
        }
        await batch.commit();
    };
};
