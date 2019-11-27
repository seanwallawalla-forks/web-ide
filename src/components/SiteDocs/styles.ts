import { Theme } from "@material-ui/core";
import { createStyles, withStyles } from "@material-ui/styles";

const homeStyles = (theme: Theme) =>
    createStyles({
        root: {
            backgroundColor: "#e8e8e8",
            fontFamily: "'Space Mono', monospace",
            width: "100%",
            height: "auto",
            bottom: "0px",
            top: "0px",
            left: 0,
            position: "absolute"
        },
        centerBox: {
            position: "absolute",
            width: "100px",
            height: "50px",
            top: "50%",
            left: "50%",
            marginTop: "-25px",
            marginLeft: "-50px"
        },
        startCodingButton: {
            fontSize: "22px",
            border: "4px solid #518C82",
            borderRadius: "80%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "220px",
            height: "220px",
            textDecoration: "none",
            background: "#00DFCB"
        }
    });

export default (ClassComponent: any) => withStyles(homeStyles)(ClassComponent);
