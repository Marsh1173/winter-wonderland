import * as CANNON from "cannon-es";

export interface Interactable {
  id: string;
  position: CANNON.Vec3;
  name: string;
  text: string[];
}

export class InteractablesManager {
  private interactables: Interactable[] = [
    {
      id: "snowman-plain",
      position: new CANNON.Vec3(-5.38, 1, -0.09),
      name: "Grumpy Snowman",
      text: [
        "Don't mind me, just slowly losing my cool.",
        "If you think you’re having a meltdown, try being me at noon.",
      ],
    },
    {
      id: "snowman-hat",
      position: new CANNON.Vec3(17.49, 0.5, -19.46),
      name: "Snowman",
      text: [
        "Just because I have a hat, are you expecting me to dance around?",
        "This hat? Oh, it’s vintage snow couture.",
        "People keep saying I look like Frosty’s cousin. Rude.",
        "This hat’s my entire personality, and I’m fine with that.",
      ],
    },
    {
      id: "reindeer",
      position: new CANNON.Vec3(-9.88, 1, -16.51),
      name: "Reindeer",
      text: [
        "I used to pull sleighs. Now I do mindfulness.",
        "Rudolph got all the songs. I got the back pain.",
        "You try wearing a bell all night and not go slightly insane.",
        "Fuelled by cocoa and mild resentment.",
      ],
    },
    {
      id: "penguin",
      position: new CANNON.Vec3(2.18, 0.4, -22.8),
      name: "Lost Penguin",
      text: ["I took a wrong iceberg.", "GPS said turn left at the glacier. I think it’s recalculating."],
    },
  ];

  get_nearby_interactable(player_position: CANNON.Vec3): Interactable | null {
    let nearest: Interactable | null = null;
    let nearest_distance = Infinity;

    const interaction_range = 2;

    for (const interactable of this.interactables) {
      const dx = player_position.x - interactable.position.x;
      const dy = player_position.y - interactable.position.y;
      const dz = player_position.z - interactable.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < interaction_range && distance < nearest_distance) {
        nearest = interactable;
        nearest_distance = distance;
      }
    }

    return nearest;
  }

  get_all_interactables(): Interactable[] {
    return this.interactables;
  }
}
