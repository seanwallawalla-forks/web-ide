import { combineReducers, Reducer } from "redux";
import ProjectsReducer from "@comp/projects/reducer";
import LoginReducer from "@comp/login/reducer";
import ThemeReducer from "@comp/themes/reducer";
import SnackbarReducer from "@comp/snackbar/reducer";
import IDReducer from "../db/id-reducer";
import ProjectEditorReducer from "@comp/project-editor/reducer";
import CsoundReducer from "@comp/csound/reducer";
import ModalReducer from "@comp/modal/reducer";
import ProfileReducer from "@comp/profile/reducer";
import ConsoleReducer from "@comp/console/reducer";
import HotKeysReducer from "@comp/hot-keys/reducer";
import HomeReducer from "@comp/home/reducer";
import TargetControlsReducer from "@comp/target-controls/reducer";
import BottomTabsReducer from "@comp/bottom-tabs/reducer";
import ProjectLastModifiedReducer from "@comp/project-last-modified/reducer";

const RootReducer = ({ routerReducer }: { routerReducer: any }): Reducer =>
    combineReducers({
        router: routerReducer,
        ProjectsReducer,
        LoginReducer,
        ProjectEditorReducer,
        userProfile: IDReducer,
        csound: CsoundReducer,
        ThemeReducer,
        ModalReducer,
        ConsoleReducer,
        ProfileReducer,
        SnackbarReducer,
        HotKeysReducer,
        TargetControlsReducer,
        ProjectLastModifiedReducer,
        BottomTabsReducer,
        HomeReducer
    });

export default RootReducer;
