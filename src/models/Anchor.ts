export class Anchor {
    id: string = "";
    name: string = "";

    constructor(headerText: string) {
        this.id = "md-" + headerText;
        this.name = headerText;
    }
}