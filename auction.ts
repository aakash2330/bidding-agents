const INITIAL_CREDITS = 1000;

enum AgentPersonality {
    DESIGNER = "designer",
    ENGINEER = "engineer",
    MARKETER = "marketer",
}

class Auction {
    private readonly agents: Agent[];
    private readonly taskDescription: string;
    private readonly tasks: Task[]

    constructor(input: string, agentPersonalities: AgentPersonality[]) {
    }

    // this is going to break down the input into a list of tasks
    private planTask() {
        await runPiAgent(this.taskDescription);
    }


    private createAgent(personality: AgentPersonality) {
        return new Agent(personality);
    }
}

