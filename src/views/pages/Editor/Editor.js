import React from "react";
import { connect } from "react-redux";
import { Card, CardHeader, CardBody, Row, Col } from "reactstrap";
import CodeEditorComponent from "../../components/CodeEditorComponent";
class Editor extends React.Component {
    render() {
        return (
            <div>
                <Row>
                    <Col>
                        <Card>
                            <CardHeader>Editor</CardHeader>
                            <CardBody>
                                <CodeEditorComponent />
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }
}

const mapStateToProps = store => {
    return {};
};

export default connect(mapStateToProps, null)(Editor);
