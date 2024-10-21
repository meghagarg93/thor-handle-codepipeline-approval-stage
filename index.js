const AWS = require('aws-sdk');
const sns = new AWS.SNS({ region: 'us-west-2' });
const codepipeline = new AWS.CodePipeline({ region: 'us-west-2' });

exports.handler = async (event) => {

    console.log("API event Output: " + JSON.stringify(event));

    try {
        // Extract parameters from query string parameters
        const { token, decision, pipelineName } = event.queryStringParameters;

        // Log the extracted parameters
        console.log('Decision:', decision);
        console.log('Token:', token);
        console.log("pipelineName", pipelineName);

        // Take appropriate action based on the decision
        if (decision === 'approve') {
            // Publish approval message to SNS topic
            await sendApprovalMessage(pipelineName, token, "Approved", "Deployment is Approved.");
            await publishApprovalMessage(token, 'Approved', pipelineName);
        } else if (decision === 'reject') {
            // Publish rejection message to SNS topic
            await sendApprovalMessage(pipelineName, token, "Rejected", "Deployment is Rejected.");
            await publishApprovalMessage(token, 'Approved', pipelineName);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Decision processed successfully' })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error processing decision' })
        };
    }
};

async function publishApprovalMessage(token, decision, pipelineName) {
    const params = {
        TopicArn: 'arn:aws:sns:us-west-2:567434252311:Inspector_to_Email',
        Message: `${decision} for Pipeline : ${pipelineName} AND token: ${token} `,
        Subject: `Deployment ${decision} for pipeline ${pipelineName}`
    };
    await sns.publish(params).promise();
}

async function sendApprovalMessage(pipelineName, approvalToken, approvalStatus, approvalMessage) {
    const params = {
        pipelineName,
        stageName: 'Approval',
        actionName: 'Approval',
        token: approvalToken,
        result: {
            summary: approvalMessage,
            status: approvalStatus  // 'Approved' or 'Rejected'
        }
    };

    return codepipeline.putApprovalResult(params).promise();
}
